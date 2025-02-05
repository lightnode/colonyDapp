import React, { useCallback } from 'react';
import { defineMessages } from 'react-intl';
import { useHistory, useParams } from 'react-router';
import { ColonyVersion } from '@colony/colony-js';

import Button, { ActionButton, IconButton } from '~core/Button';
import { ColonyExtensionQuery } from '~data/index';
import { ExtensionData } from '~data/staticData/extensionData';
import { ActionTypes } from '~redux/index';
import { Address } from '~types/index';

import { getButtonAction } from './utils';

const MSG = defineMessages({
  enable: {
    id: 'Extensions.ExtensionActionButton.enable',
    defaultMessage: 'Enable',
  },
  install: {
    id: 'Extensions.ExtensionActionButton.install',
    defaultMessage: 'Install',
  },
});

interface Props {
  colonyAddress: Address;
  extension: ExtensionData;
  installedExtension?: ColonyExtensionQuery['colonyExtension'] | null;
  colonyVersion: string;
  extensionCompatible?: boolean;
}

const ExtensionActionButton = ({
  colonyAddress,
  colonyVersion,
  extension,
  installedExtension,
  extensionCompatible = true,
}: Props) => {
  const history = useHistory();
  const { colonyName, extensionId } = useParams<{
    colonyName: string;
    extensionId: string;
  }>();

  const handleEnableButtonClick = useCallback(() => {
    history.push(`/colony/${colonyName}/extensions/${extensionId}/setup`);
  }, [colonyName, extensionId, history]);

  const isSupportedColonyVersion =
    parseInt(colonyVersion || '1', 10) >= ColonyVersion.LightweightSpaceship;

  if (!installedExtension) {
    return (
      <ActionButton
        appearance={{ theme: 'primary', size: 'medium' }}
        button={IconButton}
        submit={ActionTypes.COLONY_EXTENSION_INSTALL}
        error={ActionTypes.COLONY_EXTENSION_INSTALL_ERROR}
        success={ActionTypes.COLONY_EXTENSION_INSTALL_SUCCESS}
        values={{
          colonyAddress,
          extensionId: extension.extensionId,
        }}
        text={MSG.install}
        disabled={!isSupportedColonyVersion || !extensionCompatible}
      />
    );
  }

  if (installedExtension.details.deprecated) {
    return null;
  }

  if (!installedExtension.details.initialized) {
    return (
      <Button
        appearance={{ theme: 'primary', size: 'medium' }}
        onClick={handleEnableButtonClick}
        text={MSG.enable}
        disabled={!isSupportedColonyVersion}
      />
    );
  }
  if (installedExtension.details.missingPermissions.length) {
    return (
      <ActionButton
        button={IconButton}
        submit={getButtonAction('SUBMIT', extension.extensionId)}
        error={getButtonAction('ERROR', extension.extensionId)}
        success={getButtonAction('SUCCESS', extension.extensionId)}
        values={{
          colonyAddress,
          extensionId: extension.extensionId,
        }}
        text={MSG.enable}
        disabled={!isSupportedColonyVersion}
      />
    );
  }
  return null;
};

export default ExtensionActionButton;
