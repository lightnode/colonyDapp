import { BigNumber } from 'ethers/utils';

import { TEMP_getContext, ContextModule } from '~context/index';
import { Address } from '~types/index';
import {
  MotionStakesQuery,
  MotionStakesQueryVariables,
  MotionStakesDocument,
  EventsForMotionQuery,
  EventsForMotionQueryVariables,
  EventsForMotionDocument,
  MotionsSystemMessagesQuery,
  MotionsSystemMessagesQueryVariables,
  MotionsSystemMessagesDocument,
  ColonyActionQuery,
  ColonyActionQueryVariables,
  ColonyActionDocument,
  MotionUserVoteRevealedQuery,
  MotionUserVoteRevealedQueryVariables,
  MotionUserVoteRevealedDocument,
  MotionCurrentUserVotedQuery,
  MotionCurrentUserVotedQueryVariables,
  MotionCurrentUserVotedDocument,
  StakeAmountsForMotionQuery,
  StakeAmountsForMotionQueryVariables,
  StakeAmountsForMotionDocument,
  MotionFinalizedQuery,
  MotionFinalizedQueryVariables,
  MotionFinalizedDocument,
} from '~data/index';

export function* updateMotionValues(
  colonyAddress: Address,
  userAddress: Address,
  motionId: BigNumber,
  transactionHash: string,
  stakeSide?: string,
) {
  const apolloClient = TEMP_getContext(ContextModule.ApolloClient);

  /*
   * Staking values
   */
  yield apolloClient.query<MotionStakesQuery, MotionStakesQueryVariables>({
    query: MotionStakesDocument,
    variables: {
      colonyAddress,
      userAddress,
      motionId: motionId.toNumber(),
    },
    fetchPolicy: 'network-only',
  });

  /*
   * Vote Revelead
   */
  yield apolloClient.query<
    MotionUserVoteRevealedQuery,
    MotionUserVoteRevealedQueryVariables
  >({
    query: MotionUserVoteRevealedDocument,
    variables: {
      colonyAddress,
      userAddress,
      motionId: motionId.toNumber(),
    },
    fetchPolicy: 'network-only',
  });

  /*
   * User voted check
   */
  yield apolloClient.query<
    MotionCurrentUserVotedQuery,
    MotionCurrentUserVotedQueryVariables
  >({
    query: MotionCurrentUserVotedDocument,
    variables: {
      colonyAddress,
      userAddress,
      motionId: motionId.toNumber(),
    },
    fetchPolicy: 'network-only',
  });

  if (stakeSide) {
    /*
     * Total stake widget values
     */
    yield apolloClient.query<
      StakeAmountsForMotionQuery,
      StakeAmountsForMotionQueryVariables
    >({
      query: StakeAmountsForMotionDocument,
      variables: {
        colonyAddress,
        userAddress,
        motionId: motionId.toNumber(),
        stakeSide,
      },
      fetchPolicy: 'network-only',
    });
  }

  /*
   * Is motion finalized check
   */
  yield apolloClient.query<MotionFinalizedQuery, MotionFinalizedQueryVariables>(
    {
      query: MotionFinalizedDocument,
      variables: {
        colonyAddress,
        motionId: motionId.toNumber(),
      },
      fetchPolicy: 'network-only',
    },
  );

  /*
   * Motion Events
   */
  yield apolloClient.query<EventsForMotionQuery, EventsForMotionQueryVariables>(
    {
      query: EventsForMotionDocument,
      variables: {
        colonyAddress,
        motionId: motionId.toNumber(),
      },
      fetchPolicy: 'network-only',
    },
  );

  /*
   * Motion System Messages
   */
  yield apolloClient.query<
    MotionsSystemMessagesQuery,
    MotionsSystemMessagesQueryVariables
  >({
    query: MotionsSystemMessagesDocument,
    variables: {
      colonyAddress,
      motionId: motionId.toNumber(),
    },
    fetchPolicy: 'network-only',
  });

  /*
   * Colony Actions (to get the refreshed motion state)
   *
   * @NOTE It might make sense in the long run to just create a separate
   * resolver just for the motion's state. It will cut down on fetching
   * data we don't need just to show the updated state
   */
  yield apolloClient.query<ColonyActionQuery, ColonyActionQueryVariables>({
    query: ColonyActionDocument,
    variables: {
      colonyAddress,
      transactionHash,
    },
    fetchPolicy: 'network-only',
  });
}
