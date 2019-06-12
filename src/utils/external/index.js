/* @flow */
import BN from 'bn.js';
import { fromWei } from 'ethjs-unit';
import { isAddress } from 'web3-utils';

import type { Address } from '~types';

type EthUsdResponse = {
  status: string,
  message: string,
  result: {
    ethbtc: string,
    ethbtc_timestamp: string,
    ethusd: string,
    ethusd_timestamp: string,
  },
};

type TokenDetailsError = {|
  error: {
    code?: number,
    message: string,
  },
|};

type TokenDetails = {|
  name: string,
  symbol: string,
  decimals: number,
|};

/*
  Request dollar conversion value from etherScan
*/
export const getEthToUsd = (ethValue: BN): Promise<number | void> => {
  const ETH_USD_KEY = 'ethUsd';
  const ETH_USD_TIMESTAMP_KEY = 'ethUsdTimestamp';

  const conversionRateEndpoint =
    'https://api.etherscan.io/api?module=stats&action=ethprice';

  const cachedEthUsd = localStorage.getItem(ETH_USD_KEY) || null;
  const cachedEthUsdTimestamp =
    localStorage.getItem(ETH_USD_TIMESTAMP_KEY) || null;
  const currentTimestamp = new Date().getTime();

  if (cachedEthUsd && cachedEthUsdTimestamp) {
    /*
      Cache exchange rate for one day
    */
    const olderThanOneDay =
      currentTimestamp - parseInt(cachedEthUsdTimestamp, 10) > 86400000;
    if (!olderThanOneDay) {
      return Promise.resolve(
        fromWei(ethValue, 'ether') * parseFloat(cachedEthUsd),
      );
    }
  }

  return fetch(conversionRateEndpoint)
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then((response: EthUsdResponse) => {
      const {
        result: { ethusd: ethUsd },
        status,
      } = response;
      if (status !== '1') {
        throw Error(`Invalid response data for getEthToUsd().`);
      }

      localStorage.setItem(ETH_USD_KEY, ethUsd);
      localStorage.setItem(ETH_USD_TIMESTAMP_KEY, currentTimestamp.toString());
      return fromWei(ethValue, 'ether') * parseFloat(ethUsd);
    })
    .catch(console.warn);
};

/*
 * Lookup a token contract address to either get token details (verified)
 * or an error (unverified). Useful for bring-your-own-token.
 *
 * @NOTE only operates on mainnet.
 */
export const getTokenDetails = async (
  tokenAddress: Address,
): Promise<TokenDetails | TokenDetailsError | void> => {
  const TOKEN_DETAILS_KEY = `tokenDetails_${tokenAddress}`;
  const TOKEN_TIMESTAMP_KEY = `tokenTimestamp_${tokenAddress}`;

  const cachedTokenDetails = localStorage.getItem(TOKEN_DETAILS_KEY) || null;
  const cachedTokenTimestamp =
    localStorage.getItem(TOKEN_TIMESTAMP_KEY) || null;
  const currentTimestamp = new Date().getTime();

  if (cachedTokenDetails && cachedTokenTimestamp) {
    /*
      Cache token details (or error/inability to fetch info) for one day
    */
    const olderThanOneDay =
      currentTimestamp - parseInt(cachedTokenTimestamp, 10) > 86400000;
    if (!olderThanOneDay) {
      return Promise.resolve(JSON.parse(cachedTokenDetails));
    }
  }

  let tokenDetails: Promise<TokenDetails | TokenDetailsError>;
  try {
    if (!isAddress(tokenAddress)) {
      // don't bother looking it up if it's an invalid token address
      throw Error('Invalid token address');
    }
    // eslint-disable-next-line max-len, prettier/prettier
    const endpoint = `//api.ethplorer.io/getTokenInfo/${tokenAddress}?apiKey=${process.env.ETHPLORER_API_KEY || ''}`;
    const response = await fetch(endpoint);
    tokenDetails = await response.json();
  } catch (caughtError) {
    tokenDetails = Promise.resolve({
      error: { message: 'Unable to fetch token details.' },
    });
  }
  if (isAddress(tokenAddress)) {
    // only cache the result for valid token addresses
    localStorage.setItem(TOKEN_DETAILS_KEY, JSON.stringify(tokenDetails));
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, currentTimestamp.toString());
  }
  return tokenDetails;
};
