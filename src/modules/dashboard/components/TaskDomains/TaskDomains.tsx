import React, { useCallback, /* useEffect, */ useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
/* import BigNumber from 'bn.js'; */

import { COLONY_TOTAL_BALANCE_DOMAIN_ID } from '~constants';
import Button from '~core/Button';
import { Form } from '~core/Fields';
import Heading from '~core/Heading';
import ItemsList from '~core/ItemsList';
import {
  useSetTaskDomainMutation,
  /* useTokenBalancesForDomainsLazyQuery, */
  AnyTask,
  /* FullColonyFragment, */
  Payouts,
} from '~data/index';
import { DomainType } from '~immutable/index';
import { Address } from '~types/index';
import { useDataFetcher } from '~utils/hooks';
/* import { bnLessThan } from '~utils/numbers'; */
/* import { getBalanceFromToken } from '~utils/tokens'; */

import { domainsFetcher } from '../../fetchers';

import styles from './TaskDomains.css';

const MSG = defineMessages({
  insufficientFundsInDomain: {
    id: 'dashboard.TaskDomains.insufficientFundsInDomain',
    defaultMessage: 'This domain has insufficient funds.',
  },
  notSet: {
    id: 'dashboard.TaskDomains.notSet',
    defaultMessage: 'Domain not set',
  },
  title: {
    id: 'dashboard.TaskDomains.title',
    defaultMessage: 'Domain',
  },
  selectDomain: {
    id: 'dashboard.TaskDomains.selectDomain',
    defaultMessage: `{domainSelected, select,
      undefined {Add +}
      other {Modify}
    }`,
  },
});

interface FormValues {
  taskDomains: number;
}

interface Props {
  colonyAddress: Address;
  disabled?: boolean;
  draftId: AnyTask['id'];
  ethDomainId: number;
  payouts: Payouts;
}

// This odd typing makes DomainType compatible with ConsumableItem
interface ConsumableDomainType extends Omit<DomainType, 'id'> {
  id: number;
  children?: any;
  parent?: any;
}
type ConsumableDomainArray = ConsumableDomainType[];

const displayName = 'dashboard.TaskDomains';

const TaskDomains = ({
  colonyAddress,
  ethDomainId,
  draftId,
  disabled,
}: /* payouts, */
Props) => {
  const [setDomain] = useSetTaskDomainMutation();

  const handleSetDomain = useCallback(
    ({ taskDomains }: FormValues) => {
      setDomain({
        variables: {
          input: {
            ethDomainId: taskDomains,
            id: draftId,
          },
        },
      });
    },
    [draftId, setDomain],
  );

  const { data: domains } = useDataFetcher(
    domainsFetcher,
    [colonyAddress],
    [colonyAddress],
  );

  // @TODO Fix token balances infinite loop
  // @BODY This code checks for sufficient funds in a pot in order to change the domain of a task. Since we have disabled this functionality, we commented out this code. Also, it doesn't really work. This code will yield an infinite loop of requests to the server and the local resolvers. This has to be fixed before enabling this again.

  /* const [ */
  /*   loadTokenBalances, */
  /*   { data: tokenBalancesForDomainsData }, */
  /* ] = useTokenBalancesForDomainsLazyQuery(); */
  /* useEffect(() => { */
  /*   if (domains) { */
  /*     const domainIds = Object.keys(domains).map(d => parseInt(d, 10)); */
  /*     const tokenAddresses = payouts.map(({ token }) => token.address); */
  /*     loadTokenBalances({ */
  /*       variables: { */
  /*         colonyAddress, */
  /*         tokenAddresses, */
  /*         domainIds, */
  /*       }, */
  /*     }); */
  /*   } */
  /* }, [colonyAddress, domains, loadTokenBalances, payouts]); */

  /* const domainHasEnoughFunds = useCallback( */
  /*   (dId: number) => */
  /*     payouts.every(({ amount, token }) => { */
  /*       if (!tokenBalancesForDomainsData) return false; */
  /*       const { */
  /*         colony: { tokens }, */
  /*       } = tokenBalancesForDomainsData; */
  /*       const tokenWithBalances = tokens.find(t => t.address === token.address); */
  /*       const tokenBalanceInDomain = getBalanceFromToken( */
  /*         tokenWithBalances, */
  /*         dId, */
  /*       ); */
  /*       return !bnLessThan(new BigNumber(tokenBalanceInDomain), amount); */
  /*     }), */
  /*   [payouts, tokenBalancesForDomainsData], */
  /* ); */

  const consumableDomains: ConsumableDomainArray = useMemo(
    () =>
      Object.keys(domains || {})
        .sort()
        .map((id) => ({
          ...(domains || {})[id],
          disabled: false,
          /* disabled: !domainHasEnoughFunds(parseInt(id, 10)), */
          id: parseInt(id, 10),
        }))
        /**
         * @NOTE Temporary patch
         *
         * This will return just the selected domain from the consumables array
         * This is needed since the items list will sort the array and such will
         * always return ROOT as the first domain, which will be "selected" on the task
         *
         * This is a visual change only, to display the "correct" domain, but one
         * that will need to be removed once we bring back the feature to be able
         * to select domains after a task's creation.
         */
        .filter(({ id }) => id === ethDomainId),
    [domains, ethDomainId],
  );

  return (
    <div className={styles.main}>
      <Form
        initialValues={{
          taskDomains: ethDomainId || COLONY_TOTAL_BALANCE_DOMAIN_ID,
        }}
        onSubmit={handleSetDomain}
      >
        {({ submitForm, values: { taskDomains } }) => (
          <>
            <ItemsList
              list={consumableDomains}
              name="taskDomains"
              showArrow={false}
              onChange={submitForm}
              disabled={disabled}
            >
              <div className={styles.controls}>
                <Heading
                  appearance={{ size: 'small', margin: 'none' }}
                  text={MSG.title}
                />
                {!disabled && (
                  <Button
                    appearance={{ theme: 'blue', size: 'small' }}
                    text={MSG.selectDomain}
                    textValues={{ domainSelected: taskDomains }}
                  />
                )}
              </div>
            </ItemsList>
            {!ethDomainId && (
              <span className={styles.notSet}>
                <FormattedMessage {...MSG.notSet} />
              </span>
            )}
          </>
        )}
      </Form>
    </div>
  );
};

TaskDomains.displayName = displayName;

export default TaskDomains;
