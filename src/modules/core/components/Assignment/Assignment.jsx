/* @flow */

import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import type { TaskPayoutType, UserType } from '~immutable';

import Icon from '~core/Icon';
import UserAvatarFactory from '~core/UserAvatar';
import PayoutsList from '~core/PayoutsList';

import styles from './Assignment.css';

const MSG = defineMessages({
  selectMember: {
    id: 'Assignment.selectMember',
    defaultMessage: 'Select member',
  },
  fundingNotSet: {
    id: 'Assignment.fundingNotSet',
    defaultMessage: 'Funding not set',
  },
  pendingAssignment: {
    id: 'Assignment.pendingAssignment',
    defaultMessage: 'Pending',
  },
  placeholder: {
    id: 'Assignment.placeholder',
    defaultMessage: 'Unassigned',
  },
  reputation: {
    id: 'dashboard.TaskList.TaskListItem.reputation',
    defaultMessage: '+{reputation} max rep',
  },
});

const UserAvatar = UserAvatarFactory({ fetchUser: false });

type Props = {|
  /** Actual assignee */
  assignee?: UserType,
  /** List of payouts per token that has been set for a task */
  payouts?: Array<TaskPayoutType>,
  /** current user reputation */
  reputation?: number,
  /** The assignment has to be confirmed first and can therefore appear as pending,
   * since this component is only
   */
  pending?: boolean,
  /** We need to be aware of the native token to adjust the UI */
  nativeToken: string,
  showFunding?: boolean,
|};

const Assignment = ({
  assignee,
  payouts,
  reputation,
  pending,
  nativeToken,
  showFunding,
}: Props) => {
  const fundingWithNativeToken =
    payouts && payouts.find(payout => payout.token.symbol === nativeToken);

  return (
    <div>
      <div className={styles.displayContainer}>
        {assignee ? (
          <div className={styles.avatarContainer}>
            <UserAvatar
              className={styles.recipientAvatar}
              address={assignee.profile.walletAddress}
              user={assignee}
              size="xs"
            />
          </div>
        ) : (
          <Icon
            className={styles.icon}
            name="circle-person"
            title={MSG.selectMember}
          />
        )}
        <div className={styles.container}>
          {assignee ? (
            <div
              role="button"
              className={pending ? styles.pending : styles.assigneeName}
            >
              {assignee.profile.displayName}
              {pending && (
                <span className={styles.pendingLabel}>
                  <FormattedMessage {...MSG.pendingAssignment} />
                </span>
              )}
            </div>
          ) : (
            <div className={styles.placeholder}>
              <FormattedMessage {...MSG.placeholder} />
            </div>
          )}
        </div>
        {showFunding && (
          <div className={styles.fundingContainer}>
            {reputation && fundingWithNativeToken && (
              <span className={styles.reputation}>
                <FormattedMessage
                  {...MSG.reputation}
                  values={{ reputation: reputation.toString() }}
                />
              </span>
            )}
            {payouts ? (
              <PayoutsList payouts={payouts} nativeToken="CLNY" maxLines={2} />
            ) : (
              <FormattedMessage {...MSG.fundingNotSet} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

Assignment.defaultProps = { showFunding: true };

export default Assignment;
