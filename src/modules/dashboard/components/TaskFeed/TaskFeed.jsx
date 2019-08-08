/* @flow */

// $FlowFixMe
import React, { useRef, useLayoutEffect } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import type { Address } from '~types';
import type { TaskDraftId, TaskFeedItemType } from '~immutable';

import { SpinnerLoader } from '~core/Preloaders';
import { useDataSubscriber } from '~utils/hooks';

import TaskFeedCompleteInfo from './TaskFeedCompleteInfo.jsx';
import TaskFeedEvent from './TaskFeedEvent.jsx';
import TaskFeedComment from './TaskFeedComment.jsx';
import TaskFeedRating from './TaskFeedRating.jsx';
import { taskFeedItemsSubscriber } from '../../subscribers';

import styles from './TaskFeed.css';

const displayName = 'dashboard.TaskFeed';

type Props = {|
  colonyAddress: Address,
  draftId: TaskDraftId,
|};

const MSG = defineMessages({
  feedLoadingText: {
    id: 'dashboard.TaskFeed.feedLoadingText',
    defaultMessage: 'Loading Task Events...',
  },
});

const TaskFeed = ({ colonyAddress, draftId }: Props) => {
  const bottomEl = useRef();

  const scrollToEnd = () => {
    if (bottomEl.current) {
      bottomEl.current.scrollIntoView(false);
    }
  };

  useLayoutEffect(
    () => {
      // Content is not fully loaded at first, wait a moment
      setTimeout(scrollToEnd, 1000);
    },
    [bottomEl],
  );

  const {
    data: feedItems,
    isFetching: isFetchingFeedItems,
  } = useDataSubscriber<TaskFeedItemType[]>(
    taskFeedItemsSubscriber,
    [draftId],
    [colonyAddress, draftId],
  );

  const nFeedItems = feedItems ? feedItems.length : 0;
  useLayoutEffect(scrollToEnd, [nFeedItems]);

  return isFetchingFeedItems ? (
    <SpinnerLoader />
  ) : (
    <>
      {feedItems && (
        <div className={styles.main}>
          <div className={styles.items}>
            {/*
             * @NOTE We always have at least one task event: task created
             */
            feedItems.length < 1 ? (
              <div className={styles.eventsLoader}>
                <SpinnerLoader appearance={{ size: 'small' }} />
                <span className={styles.eventsLoaderText}>
                  <FormattedMessage {...MSG.feedLoadingText} />
                </span>
              </div>
            ) : (
              <div>
                {feedItems.map(({ id, createdAt, comment, event, rating }) => {
                  if (comment) {
                    return (
                      <TaskFeedComment
                        key={id}
                        comment={comment}
                        createdAt={createdAt}
                      />
                    );
                  }

                  if (event && event.type === 'TASK_FINALIZED') {
                    return (
                      <>
                        {/*
                         * @NOTE This needs manual IDs since using the same task event
                         * to display both the receipt and the completed event
                         */}
                        <TaskFeedCompleteInfo
                          key={`${id}_payment`}
                          event={event}
                          createdAt={createdAt}
                        />
                        <TaskFeedEvent
                          key={`${id}_finalized`}
                          colonyAddress={colonyAddress}
                          createdAt={createdAt}
                          event={event}
                        />
                      </>
                    );
                  }

                  if (event) {
                    return (
                      <TaskFeedEvent
                        colonyAddress={colonyAddress}
                        createdAt={createdAt}
                        event={event}
                        key={id}
                      />
                    );
                  }

                  /**
                   * @todo Check that the reveal period is over for ratings (task feed).
                   */
                  if (rating) {
                    return <TaskFeedRating key={id} rating={rating} />;
                  }

                  return null;
                })}
                <div ref={bottomEl} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

TaskFeed.displayName = displayName;

export default TaskFeed;
