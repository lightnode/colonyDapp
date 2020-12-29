import React, { useState } from 'react';
import { ColonyRole } from '@colony/colony-js';
import { FormikProps } from 'formik';
import { FormattedMessage, defineMessages } from 'react-intl';

import Button from '~core/Button';
import ColorSelect from '~core/ColorSelect';
import { Color } from '~core/ColorTag';
import DialogSection from '~core/Dialog/DialogSection';
import { Input, Annotations } from '~core/Fields';
import Heading from '~core/Heading';
import PermissionsLabel from '~core/PermissionsLabel';
import PermissionRequiredInfo from '~core/PermissionRequiredInfo';

import { Colony, useLoggedInUser } from '~data/index';
import { useTransformer } from '~utils/hooks';

import { getAllUserRoles } from '../../../transformers';
import { canArchitect } from '../../../users/checks';

import { FormValues } from './CreateEditDomainDialog';
import styles from './CreateEditDomainDialogForm.css';

const MSG = defineMessages({
  title: {
    id: 'dashboard.CreateEditDomainDialog.CreateEditDomainDialogForm.title',
    defaultMessage: 'Create a new domain',
  },
  name: {
    id: 'dashboard.CreateEditDomainDialog.CreateEditDomainDialogForm.name',
    defaultMessage: 'Domain name',
  },
  purpose: {
    id: 'dashboard.CreateEditDomainDialog.CreateEditDomainDialogForm.name',
    defaultMessage: 'What is the purpose of this domain?',
  },
  annotation: {
    id:
      'dashboard.CreateEditDomainDialog.CreateEditDomainDialogForm.annotation',
    defaultMessage: 'Explain why you’re creating this domain',
  },
  noPermissionFrom: {
    id:
      'dashboard.CreatePaymentDialog.CreatePaymentDialogForm.noPermissionFrom',
    defaultMessage:
      // eslint-disable-next-line max-len
      'You do not have the {roleRequired} permission required to take this action.',
  },
});

interface Props {
  back: () => void;
  colony: Colony;
}

const CreateEditDomainDialogForm = ({
  back,
  colony,
  handleSubmit,
}: Props & FormikProps<FormValues>) => {
  const [domainColor, setDomainColor] = useState(Color.LightPink);

  const { walletAddress, username, ethereal } = useLoggedInUser();

  const allUserRoles = useTransformer(getAllUserRoles, [colony, walletAddress]);

  const hasRegisteredProfile = !!username && !ethereal;
  const canCreateEditDomain =
    hasRegisteredProfile && canArchitect(allUserRoles);

  return (
    <>
      <DialogSection>
        <Heading
          appearance={{ size: 'medium', margin: 'none' }}
          text={MSG.title}
        />
      </DialogSection>
      {!canCreateEditDomain && (
        <DialogSection>
          <PermissionRequiredInfo requiredRoles={[ColonyRole.Administration]} />
        </DialogSection>
      )}
      <DialogSection>
        <div className={styles.displayFlex}>
          <div className={styles.domainName}>
            <Input
              label={MSG.name}
              name="name"
              appearance={{ colorSchema: 'grey', theme: 'fat' }}
              disabled={!canCreateEditDomain}
            />
          </div>
          <ColorSelect
            activeOption={domainColor}
            alignOptions="right"
            onColorChange={setDomainColor}
            disabled={!canCreateEditDomain}
          />
        </div>
      </DialogSection>
      <DialogSection>
        <Input
          label={MSG.purpose}
          name="purpose"
          appearance={{ colorSchema: 'grey', theme: 'fat' }}
          maxLength={90}
          disabled={!canCreateEditDomain}
        />
      </DialogSection>
      <DialogSection>
        <Annotations
          label={MSG.annotation}
          name="annotation"
          disabled={!canCreateEditDomain}
        />
      </DialogSection>
      {!canCreateEditDomain && (
        <DialogSection>
          <span className={styles.noPermissionFromMessage}>
            <FormattedMessage
              {...MSG.noPermissionFrom}
              values={{
                roleRequired: (
                  <PermissionsLabel
                    permission={ColonyRole.Administration}
                    name={{ id: `role.${ColonyRole.Administration}` }}
                  />
                ),
              }}
            />
          </span>
        </DialogSection>
      )}
      <DialogSection appearance={{ align: 'right', theme: 'footer' }}>
        <Button
          text={{ id: 'button.back' }}
          onClick={back}
          appearance={{ theme: 'secondary', size: 'large' }}
        />
        <Button
          text={{ id: 'button.confirm' }}
          appearance={{ theme: 'primary', size: 'large' }}
          onClick={() => handleSubmit()}
          disabled={!canCreateEditDomain}
        />
      </DialogSection>
    </>
  );
};

export default CreateEditDomainDialogForm;
