import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { FormikProps } from 'formik';
import {
  defineMessages,
  FormattedMessage,
  MessageDescriptor,
} from 'react-intl';
import { bigNumberify } from 'ethers/utils';
import moveDecimal from 'move-decimal-point';
import sortBy from 'lodash/sortBy';
import { ColonyRole, ROOT_DOMAIN_ID } from '@colony/colony-js';
import { AddressZero } from 'ethers/constants';

import EthUsd from '~core/EthUsd';
import Numeral from '~core/Numeral';
import PermissionsLabel from '~core/PermissionsLabel';
import Button from '~core/Button';
import { ItemDataType } from '~core/OmniPicker';
import { ActionDialogProps } from '~core/Dialog';
import DialogSection from '~core/Dialog/DialogSection';
import { Select, Input, Annotations, TokenSymbolSelector } from '~core/Fields';
import Heading from '~core/Heading';
import SingleUserPicker, { filterUserSelection } from '~core/SingleUserPicker';
import PermissionRequiredInfo from '~core/PermissionRequiredInfo';
import Toggle from '~core/Fields/Toggle';
import NotEnoughReputation from '~dashboard/NotEnoughReputation';
import MotionDomainSelect from '~dashboard/MotionDomainSelect';

import { Address } from '~types/index';
import HookedUserAvatar from '~users/HookedUserAvatar';
import {
  useLoggedInUser,
  useTokenBalancesForDomainsLazyQuery,
  AnyUser,
} from '~data/index';
import {
  getBalanceFromToken,
  getTokenDecimalsWithFallback,
} from '~utils/tokens';
import { useDialogActionPermissions } from '~utils/hooks/useDialogActionPermissions';
import { useTransformer } from '~utils/hooks';
import { useEnabledExtensions } from '~utils/hooks/useEnabledExtensions';
import { getUserRolesForDomain } from '~modules/transformers';
import { userHasRole } from '~modules/users/checks';

import { FormValues } from './CreatePaymentDialog';

import styles from './CreatePaymentDialogForm.css';

const MSG = defineMessages({
  title: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.title',
    defaultMessage: 'Payment',
  },
  from: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.from',
    defaultMessage: 'From',
  },
  to: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.to',
    defaultMessage: 'Assignee',
  },
  amount: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.amount',
    defaultMessage: 'Amount',
  },
  token: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.address',
    defaultMessage: 'Token',
  },
  annotation: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.annotation',
    defaultMessage: 'Explain why you’re making this payment (optional)',
  },
  domainTokenAmount: {
    id:
      'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.domainTokenAmount',
    defaultMessage: 'Available Funds: {amount} {symbol}',
  },
  noAmount: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.noAmount',
    defaultMessage: 'Amount must be greater than zero',
  },
  noBalance: {
    id: 'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.noBalance',
    defaultMessage: 'Insufficient balance in from domain pot',
  },
  noPermissionFrom: {
    id:
      'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.noPermissionFrom',
    defaultMessage: `You do not have the {firstRoleRequired} and
    {secondRoleRequired} permissions required to take this action.`,
  },
  noOneTxExtension: {
    id:
      'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.noOneTxExtension',
    defaultMessage: `The OneTxPayment extension is not installed in this colony.
    Please use the Extensions Manager to install it if you want to make a new
    payment.`,
  },
  userPickerPlaceholder: {
    id: 'SingleUserPicker.userPickerPlaceholder',
    defaultMessage: 'Search for a user or paste wallet address',
  },
});
interface Props extends ActionDialogProps {
  subscribedUsers: AnyUser[];
  ethDomainId?: number;
}

const UserAvatar = HookedUserAvatar({ fetchUser: false });

const supRenderAvatar = (address: Address, item: ItemDataType<AnyUser>) => (
  <UserAvatar address={address} user={item} size="xs" notSet={false} />
);

const CreatePaymentDialogForm = ({
  back,
  colony,
  colony: { colonyAddress, domains, tokens },
  isVotingExtensionEnabled,
  subscribedUsers,
  handleSubmit,
  setFieldValue,
  isSubmitting,
  isValid,
  values,
  ethDomainId: preselectedDomainId,
}: Props & FormikProps<FormValues>) => {
  const selectedDomain =
    preselectedDomainId === 0 || preselectedDomainId === undefined
      ? ROOT_DOMAIN_ID
      : preselectedDomainId;

  const domainId = values.domainId
    ? parseInt(values.domainId, 10)
    : selectedDomain;
  /*
   * Custom error state tracking
   */
  const [customAmountError, setCustomAmountError] = useState<
    MessageDescriptor | string | undefined
  >(undefined);
  const [currentFromDomain, setCurrentFromDomain] = useState<number>(domainId);
  const { tokenAddress, amount } = values;

  const selectedToken = useMemo(
    () => tokens.find((token) => token.address === values.tokenAddress),
    [tokens, values.tokenAddress],
  );

  const { walletAddress } = useLoggedInUser();

  const fromDomainRoles = useTransformer(getUserRolesForDomain, [
    colony,
    walletAddress,
    domainId,
  ]);

  const domainOptions = useMemo(
    () =>
      sortBy(
        domains.map(({ name, ethDomainId }) => ({
          value: ethDomainId.toString(),
          label: name,
        })),
        ['value'],
      ),

    [domains],
  );

  const [
    loadTokenBalances,
    { data: tokenBalancesData },
  ] = useTokenBalancesForDomainsLazyQuery();

  useEffect(() => {
    if (tokenAddress) {
      loadTokenBalances({
        variables: {
          colonyAddress,
          tokenAddresses: [tokenAddress],
          domainIds: [domainId],
        },
      });
    }
  }, [colonyAddress, tokenAddress, domainId, loadTokenBalances]);

  const fromDomainTokenBalance = useMemo(() => {
    const token =
      tokenBalancesData &&
      tokenBalancesData.tokens.find(({ address }) => address === tokenAddress);
    if (token) {
      /*
       * Reset our custom error state, since we changed the domain
       */
      setCustomAmountError(undefined);
      return getBalanceFromToken(token, domainId);
    }
    return null;
  }, [domainId, tokenAddress, tokenBalancesData]);

  useEffect(() => {
    if (selectedToken && amount) {
      const convertedAmount = bigNumberify(
        moveDecimal(
          amount,
          getTokenDecimalsWithFallback(selectedToken.decimals),
        ),
      );
      if (
        fromDomainTokenBalance &&
        (fromDomainTokenBalance.lt(convertedAmount) ||
          fromDomainTokenBalance.isZero())
      ) {
        /*
         * @NOTE On custom, parallel, in-component error handling
         *
         * We need to keep track of a separate error state, since we are doing
         * custom validation (checking if a domain has enough funds), alongside
         * using a validationSchema.
         *
         * This makes it so that even if we manual set the error, it will get
         * overwritten instantly when the next Formik State update triggers, making
         * it basically impossible for us to manually put the Form into an error
         * state.
         *
         * See: https://github.com/formium/formik/issues/706
         *
         * Because of this, we keep our own error state that runs in parallel
         * to Formik's error state.
         */
        setCustomAmountError(MSG.noBalance);
      } else {
        setCustomAmountError(undefined);
      }
    }
  }, [
    amount,
    domainId,
    fromDomainRoles,
    fromDomainTokenBalance,
    selectedToken,
    setCustomAmountError,
  ]);

  const userHasFundingPermission = userHasRole(
    fromDomainRoles,
    ColonyRole.Funding,
  );
  const userHasAdministrationPermission = userHasRole(
    fromDomainRoles,
    ColonyRole.Administration,
  );
  const hasRoles = userHasFundingPermission && userHasAdministrationPermission;
  const requiredRoles: ColonyRole[] = [
    ColonyRole.Funding,
    ColonyRole.Administration,
  ];

  const [userHasPermission, onlyForceAction] = useDialogActionPermissions(
    colony.colonyAddress,
    hasRoles,
    isVotingExtensionEnabled,
    values.forceAction,
    domainId,
  );

  const { isOneTxPaymentExtensionEnabled } = useEnabledExtensions({
    colonyAddress,
  });

  const handleFromDomainChange = useCallback(
    (fromDomainValue) => {
      const fromDomainId = parseInt(fromDomainValue, 10);
      const selectedMotionDomainId = parseInt(values.motionDomainId, 10);
      if (
        fromDomainId !== ROOT_DOMAIN_ID &&
        fromDomainId !== currentFromDomain
      ) {
        setCurrentFromDomain(fromDomainId);
      } else {
        setCurrentFromDomain(ROOT_DOMAIN_ID);
      }
      if (selectedMotionDomainId !== fromDomainId) {
        setFieldValue('motionDomainId', fromDomainId);
      }
    },
    [currentFromDomain, setFieldValue, values.motionDomainId],
  );

  const handleFilterMotionDomains = useCallback(
    (optionDomain) => {
      const optionDomainId = parseInt(optionDomain.value, 10);
      if (currentFromDomain === ROOT_DOMAIN_ID) {
        return optionDomainId === ROOT_DOMAIN_ID;
      }
      return (
        optionDomainId === currentFromDomain ||
        optionDomainId === ROOT_DOMAIN_ID
      );
    },
    [currentFromDomain],
  );

  const handleMotionDomainChange = useCallback(
    (motionDomainId) => setFieldValue('motionDomainId', motionDomainId),
    [setFieldValue],
  );

  const canMakePayment = userHasPermission && isOneTxPaymentExtensionEnabled;

  const inputDisabled = !canMakePayment || onlyForceAction || isSubmitting;

  return (
    <>
      <DialogSection appearance={{ theme: 'sidePadding' }}>
        <div className={styles.modalHeading}>
          {isVotingExtensionEnabled && (
            <div className={styles.motionVoteDomain}>
              <MotionDomainSelect
                colony={colony}
                onDomainChange={handleMotionDomainChange}
                disabled={values.forceAction || isSubmitting}
                /*
                 * @NOTE We can only create a motion to vote in a subdomain if we
                 * create a payment from that subdomain
                 */
                filterDomains={handleFilterMotionDomains}
                initialSelectedDomain={domainId}
              />
            </div>
          )}
          <div className={styles.headingContainer}>
            <Heading
              appearance={{ size: 'medium', margin: 'none', theme: 'dark' }}
              text={MSG.title}
            />
            {hasRoles && isVotingExtensionEnabled && (
              <Toggle
                label={{ id: 'label.force' }}
                name="forceAction"
                disabled={!canMakePayment || isSubmitting}
              />
            )}
          </div>
        </div>
      </DialogSection>
      {!userHasPermission && (
        <DialogSection>
          <PermissionRequiredInfo requiredRoles={requiredRoles} />
        </DialogSection>
      )}
      <DialogSection>
        <div className={styles.domainSelects}>
          <div>
            <Select
              options={domainOptions}
              label={MSG.from}
              name="domainId"
              appearance={{ theme: 'grey', width: 'fluid' }}
              onChange={handleFromDomainChange}
              disabled={isSubmitting}
            />
            {!!tokenAddress && (
              <div className={styles.domainPotBalance}>
                <FormattedMessage
                  {...MSG.domainTokenAmount}
                  values={{
                    amount: (
                      <Numeral
                        appearance={{
                          size: 'small',
                          theme: 'grey',
                        }}
                        value={fromDomainTokenBalance || 0}
                        unit={getTokenDecimalsWithFallback(
                          selectedToken && selectedToken.decimals,
                        )}
                        truncate={3}
                      />
                    ),
                    symbol: (selectedToken && selectedToken.symbol) || '???',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </DialogSection>
      <DialogSection>
        <div className={styles.singleUserContainer}>
          <SingleUserPicker
            appearance={{ width: 'wide' }}
            data={subscribedUsers}
            label={MSG.to}
            name="recipient"
            filter={filterUserSelection}
            renderAvatar={supRenderAvatar}
            disabled={inputDisabled}
            placeholder={MSG.userPickerPlaceholder}
          />
        </div>
      </DialogSection>
      <DialogSection>
        <div className={styles.tokenAmount}>
          <div className={styles.tokenAmountInputContainer}>
            <Input
              label={MSG.amount}
              name="amount"
              appearance={{
                theme: 'minimal',
                align: 'right',
              }}
              formattingOptions={{
                delimiter: ',',
                numeral: true,
                numeralDecimalScale: getTokenDecimalsWithFallback(
                  selectedToken && selectedToken.decimals,
                ),
              }}
              disabled={inputDisabled}
              /*
               * Force the input component into an error state
               * This is needed for our custom error state to work
               */
              forcedFieldError={customAmountError}
            />
          </div>
          <div className={styles.tokenAmountContainer}>
            <div className={styles.tokenAmountSelect}>
              <TokenSymbolSelector
                label={MSG.token}
                tokens={tokens}
                name="tokenAddress"
                elementOnly
                appearance={{ alignOptions: 'right', theme: 'grey' }}
                disabled={inputDisabled}
              />
            </div>
            {values.tokenAddress === AddressZero && (
              <div className={styles.tokenAmountUsd}>
                <EthUsd
                  appearance={{ theme: 'grey' }}
                  value={
                    /*
                     * @NOTE Set value to 0 if amount is only the decimal point
                     * Just entering the decimal point will pass it through to EthUsd
                     * and that will try to fetch the balance for, which, obviously, will fail
                     */
                    values.amount && values.amount !== '.' ? values.amount : '0'
                  }
                />
              </div>
            )}
          </div>
        </div>
      </DialogSection>
      <DialogSection>
        <Annotations
          label={MSG.annotation}
          name="annotation"
          disabled={inputDisabled}
        />
      </DialogSection>
      {!userHasPermission && (
        <DialogSection appearance={{ theme: 'sidePadding' }}>
          <div className={styles.noPermissionFromMessage}>
            <FormattedMessage
              {...MSG.noPermissionFrom}
              values={{
                firstRoleRequired: (
                  <PermissionsLabel
                    permission={ColonyRole.Funding}
                    name={{ id: `role.${ColonyRole.Funding}` }}
                  />
                ),
                secondRoleRequired: (
                  <PermissionsLabel
                    permission={ColonyRole.Administration}
                    name={{ id: `role.${ColonyRole.Administration}` }}
                  />
                ),
              }}
            />
          </div>
        </DialogSection>
      )}
      {userHasPermission && !isOneTxPaymentExtensionEnabled && (
        <DialogSection appearance={{ theme: 'sidePadding' }}>
          <div className={styles.noPermissionFromMessage}>
            <FormattedMessage {...MSG.noOneTxExtension} />
          </div>
        </DialogSection>
      )}
      {onlyForceAction && (
        <NotEnoughReputation
          appearance={{ marginTop: 'negative' }}
          domainId={domainId}
        />
      )}
      <DialogSection appearance={{ align: 'right', theme: 'footer' }}>
        <Button
          appearance={{ theme: 'secondary', size: 'large' }}
          onClick={back}
          text={{ id: 'button.back' }}
        />
        <Button
          appearance={{ theme: 'primary', size: 'large' }}
          onClick={() => handleSubmit()}
          text={{ id: 'button.confirm' }}
          loading={isSubmitting}
          /*
           * Disable Form submissions if either the form is invalid, or
           * if our custom state was triggered.
           */
          disabled={!isValid || !!customAmountError || inputDisabled}
          style={{ width: styles.wideButton }}
        />
      </DialogSection>
    </>
  );
};

CreatePaymentDialogForm.displayName =
  'dashboard.CreatePaymentDialog.CreatePaymentDialogForm';

export default CreatePaymentDialogForm;
