import React, { useRef } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Colony } from '~data/index';

import styles from './Chat.css';

const MSG = defineMessages({
  emptyText: {
    id: 'dashboard.CoinMachine.Chat.emptyText',
    defaultMessage: 'Nobody`s said anything yet... 😢',
  },
  disabledText: {
    id: 'dashboard.CoinMachine.Chat.disabledText',
    defaultMessage: 'Chat is disabled until the Token Sale is ready to start',
  },
  labelLeaveComment: {
    id: 'dashboard.CoinMachine.Chat.labelLeaveComment',
    defaultMessage: 'Leave a comment',
  },
  loginToComment: {
    id: 'dashboard.CoinMachine.Chat.loginToComment',
    defaultMessage: 'Login to comment',
  },
  loading: {
    id: 'dashboard.CoinMachine.Chat.loading',
    defaultMessage: 'Loading messages',
  },
  mustWhitelistToComment: {
    id: 'dashboard.CoinMachine.Chat.mustWhitelistToComment',
    defaultMessage: 'You must be whitelisted to chat',
  },
  temporaryDisabledText: {
    id: 'dashboard.CoinMachine.Chat.temporaryDisabledText',
    defaultMessage: `Due to persistent performance issue affect site loading, the chat has been disabled.`,
  },
});

interface Props {
  colony: Colony;
  transactionHash: string;
  disabled?: boolean;
  limit?: number;
}

const displayName = 'dashboard.CoinMachine.Chat';

const Chat = () => {
  const scrollElmRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className={styles.main}>
      <div className={styles.messages}>
        <div>
          <div className={styles.empty}>
            <FormattedMessage {...MSG.temporaryDisabledText} />
          </div>
        </div>
        <div ref={scrollElmRef} />
      </div>
    </div>
  );
};

Chat.displayName = displayName;

export default Chat;
