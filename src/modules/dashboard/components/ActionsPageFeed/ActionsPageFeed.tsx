import React, { useState } from 'react';
import { nanoid } from 'nanoid';

import { SpinnerLoader } from '~core/Preloaders';

import { useTransactionMessagesQuery, ParsedEvent, AnyUser } from '~data/index';

import ActionsPageFeedItem from './ActionsPageFeedItem';
import ActionsPageEvent from './ActionsPageEvent';

import styles from './ActionsPageFeed.css';

const displayName = 'dashboard.ActionsPageFeed';

export interface PaymentDetails {
  amount: string;
  symbol: string;
  decimals: number;
}

interface Props {
  transactionHash: string;
  networkEvents?: ParsedEvent[];
  initiator?: AnyUser;
  recipient?: AnyUser;
  payment?: PaymentDetails;
}

const ActionsPageFeed = ({
  transactionHash,
  networkEvents,
  initiator,
  recipient,
  payment,
}: Props) => {
  const [autogeneratedIds] = useState<string[]>(
    [...new Array(networkEvents?.length)].map(nanoid),
  );

  const { data, loading, error } = useTransactionMessagesQuery({
    variables: { transactionHash },
  });

  if (error) {
    return null;
  }

  if (loading || !data?.transactionMessages) {
    <div className={styles.main}>
      <SpinnerLoader />
      <span>Loading Action Events and Messages</span>
    </div>;
  }

  /*
   * @NOTE At least for now we don't actually need to merge the events and
   * comments list, as they will always be separated.
   *
   * The events will always appear at the top of the feed, having the initial
   * transaction's block time.
   *
   * And, while comments can only be made after the transaction has mined, they
   * will always appear after.
   *
   * Doing it like this is simpler, and safer. At least for now.
   */
  return (
    <ul className={styles.main}>
      {networkEvents?.map(({ name, createdAt, emmitedBy, values }, index) => (
        <li key={autogeneratedIds[index]}>
          <ActionsPageEvent
            createdAt={new Date(createdAt)}
            transactionHash={transactionHash}
            eventName={name}
            initiator={initiator}
            recipient={recipient}
            payment={payment}
            emmitedBy={emmitedBy}
            eventValues={values}
          />
        </li>
      ))}
      {data?.transactionMessages.messages.map(
        ({
          initiator: messageInitiator,
          createdAt,
          sourceId,
          context: { message },
        }) => (
          <li key={sourceId}>
            <ActionsPageFeedItem
              createdAt={createdAt}
              comment={message}
              user={messageInitiator}
            />
          </li>
        ),
      )}
    </ul>
  );
};

ActionsPageFeed.displayName = displayName;

export default ActionsPageFeed;
