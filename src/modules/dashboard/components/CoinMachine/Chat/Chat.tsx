import React from 'react';

import { Colony } from '~data/index';

import styles from './Chat.css';

interface Props {
  colony: Colony;
  transactionHash: string;
  disabled?: boolean;
  limit?: number;
}

const displayName = 'dashboard.CoinMachine.Chat';

const Chat = () => {
  return (
    <div className={styles.main}>
      <div className={styles.messages} />
    </div>
  );
};

Chat.displayName = displayName;

export default Chat;
