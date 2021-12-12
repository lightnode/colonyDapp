import { Resolvers } from '@apollo/client';

import { Context } from '~context/index';
import {
  SubgraphColonyQuery,
  SubgraphColonyQueryVariables,
  SubgraphColonyDocument,
} from '~data/index';

import { getProcessedColony } from './colony';

export const metaColonyResolvers = ({
  colonyManager: { networkClient },
  apolloClient,
  ipfsWithFallback,
}: Required<Context>): Resolvers => ({
  Query: {
    async processedMetaColony() {
      try {
        const metaColonyAddress = '0xA838cC8a369439091C320bEdFB6E339b66Ae8A6F';
        const metaColonyENSName = await networkClient.lookupRegisteredENSDomain(
          metaColonyAddress,
        );
        if (metaColonyENSName) {
          const { data } = await apolloClient.query<
            SubgraphColonyQuery,
            SubgraphColonyQueryVariables
          >({
            query: SubgraphColonyDocument,
            variables: {
              address: metaColonyAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
          });
          if (data?.colony) {
            const processedColony = await getProcessedColony(
              data.colony,
              metaColonyAddress,
              ipfsWithFallback,
            );
            return {
              ...processedColony,
              __typename: 'ProcessedMetaColony',
            };
          }
          return null;
        }
        return null;
      } catch (error) {
        console.error(error);
        return null;
      }
    },
  },
});
