import React, { useState, useMemo, useCallback } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { nanoid } from 'nanoid';
import findLastIndex from 'lodash/findLastIndex';

import PermissionsLabel from '~core/PermissionsLabel';
import { TransactionMeta, TransactionStatus } from '~dashboard/ActionsPage';
import { ColonyAndExtensionsEvents, Address } from '~types/index';
import { useDataFetcher } from '~utils/hooks';
import { ipfsDataFetcher } from '../../../../core/fetchers';

import { EventValues } from '../ActionsPageFeed';
import { STATUS } from '../../ActionsPage/types';
import { EVENT_ROLES_MAP } from '../../ActionsPage/staticMaps';
import { ColonyAction, useSubgraphColonyMetadataQuery } from '~data/index';
import {
  getSpecificActionValuesCheck,
  sortMetdataHistory,
  parseColonyMetadata,
  getColonyMetadataMessageDescriptorsIds,
} from '~utils/colonyActions';

import styles from './ActionsPageEvent.css';

const displayName = 'dashboard.ActionsPageFeed.ActionsPageEvent';

const MSG = defineMessages({
  rolesTooltip: {
    id: 'dashboard.ActionsPageFeed.ActionsPageEvent.rolesTooltip',
    defaultMessage: `{icon} {role, select,
      1 {This permission allows modify colony-wide parameters, upgrade the
        colony and manage permissions in Root Domain.}
      6 {This permission allows an account to manipulate payments (tasks) in
        their domain and to raise disputes.}
      other {This is a generic placeholder for a permissions type.
        You should not be seeing this}
    }`,
  },
});

interface Props {
  eventName?: string;
  eventValues?: Record<string, any>;
  transactionHash: string;
  createdAt: Date;
  values?: EventValues;
  emmitedBy?: string;
  actionData: ColonyAction;
  colonyAddress: Address;
}

const ActionsPageEvent = ({
  createdAt,
  transactionHash,
  eventName = ColonyAndExtensionsEvents.Generic,
  values,
  emmitedBy,
  actionData,
  colonyAddress,
}: Props) => {
  let metadataJSON;
  const [metdataIpfsHash, setMetdataIpfsHash] = useState<string | undefined>(
    undefined,
  );

  /*
   * @NOTE See nanoId's docs about the reasoning for this
   * https://github.com/ai/nanoid#react
   *
   * We're creating a object with event names for keys, which, as values,
   * have an array of ids, for each available permission
   */
  const [autogeneratedIds] = useState<Record<string, string[]>>(() => {
    const eventsToIdsMap = {};
    Object.keys(EVENT_ROLES_MAP).map((name) => {
      eventsToIdsMap[name] = [...new Array(EVENT_ROLES_MAP[eventName])].map(
        nanoid,
      );
      return null;
    });
    return eventsToIdsMap;
  });

  const colonyMetadataHistory = useSubgraphColonyMetadataQuery({
    variables: {
      address: colonyAddress.toLowerCase(),
    },
  });

  /*
   * Fetch a historic metadata hash using IPFS
   */
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: ipfsMetadata } = useDataFetcher(
      ipfsDataFetcher,
      [metdataIpfsHash as string],
      [metdataIpfsHash],
    );
    metadataJSON = ipfsMetadata;
  } catch (error) {
    // silent error
  }

  /*
   * Determine if the current medata is different from the previous one,
   * and in what way
   */
  const getColonyMetadataChecks = useMemo(() => {
    if (
      eventName === ColonyAndExtensionsEvents.ColonyMetadata &&
      !!colonyMetadataHistory?.data?.colony &&
      !!actionData
    ) {
      const {
        data: {
          colony: { metadataHistory },
        },
      } = colonyMetadataHistory;
      const sortedMetdataHistory = sortMetdataHistory(metadataHistory);
      const currentMedataIndex = findLastIndex(
        sortedMetdataHistory,
        ({ transaction: { id: hash } }) => hash === actionData.hash,
      );
      /*
       * We have a previous metadata entry
       */
      if (currentMedataIndex > 0) {
        const prevMetdata = sortedMetdataHistory[currentMedataIndex - 1];
        if (prevMetdata) {
          setMetdataIpfsHash(prevMetdata.metadata);
          if (metadataJSON) {
            return getSpecificActionValuesCheck(
              eventName as ColonyAndExtensionsEvents,
              actionData,
              parseColonyMetadata(metadataJSON),
            );
          }
        }
      }
      /*
       * We don't have a previous metadata entry
       */
      const { colonyDisplayName, colonyAvatarHash, colonyTokens } = actionData;
      return {
        nameChanged: !!colonyDisplayName,
        logoChanged: !!colonyAvatarHash,
        tokensChanged: !!colonyTokens.length,
      };
    }
    return {
      nameChanged: false,
      logoChanged: false,
      tokensChanged: false,
    };
  }, [colonyMetadataHistory, actionData, metadataJSON, eventName]);

  console.log(getColonyMetadataChecks);

  return (
    <div className={styles.main}>
      <div className={styles.status}>
        <TransactionStatus status={STATUS.Succeeded} showTooltip={false} />
      </div>
      <div className={styles.content}>
        <div className={styles.text}>
          <FormattedMessage
            id={
              eventName === ColonyAndExtensionsEvents.ColonyMetadata
                ? getColonyMetadataMessageDescriptorsIds(
                    ColonyAndExtensionsEvents.ColonyMetadata,
                    getColonyMetadataChecks,
                  )
                : 'event.title'
            }
            values={{
              ...values,
              fromDomain: values?.fromDomain?.name,
              toDomain: values?.toDomain?.name,
              eventName,
              /*
               * Usefull if a event isn't found or doesn't have a message descriptor
               */
              eventNameDecorated: <b>{eventName}</b>,
              clientOrExtensionType: (
                <span className={styles.highlight}>{emmitedBy}</span>
              ),
            }}
          />
        </div>
        <div className={styles.details}>
          <div className={styles.roles}>
            {eventName &&
              EVENT_ROLES_MAP[eventName] &&
              EVENT_ROLES_MAP[eventName].map((role, index) => (
                <PermissionsLabel
                  key={autogeneratedIds[eventName][index]}
                  appearance={{ theme: 'simple' }}
                  permission={role}
                  minimal
                  infoMessage={MSG.rolesTooltip}
                  infoMessageValues={{
                    role,
                    icon: (
                      <div className={styles.tooltipIcon}>
                        <PermissionsLabel
                          permission={role}
                          appearance={{ theme: 'white' }}
                        />
                      </div>
                    ),
                  }}
                />
              ))}
          </div>
          {transactionHash && (
            <div className={styles.meta}>
              <TransactionMeta
                transactionHash={transactionHash}
                createdAt={createdAt}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ActionsPageEvent.displayName = displayName;

export default ActionsPageEvent;
