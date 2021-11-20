import React, { useEffect, useMemo } from 'react';
import { defineMessages, FormattedDate, FormattedMessage } from 'react-intl';
import isEmpty from 'lodash/isEmpty';
import { bigNumberify } from 'ethers/utils';

import Heading from '~core/Heading';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '~core/Table';
import ExternalLink from '~core/ExternalLink';
import { MiniSpinnerLoader } from '~core/Preloaders';

import { getFormattedTokenValue } from '~utils/tokens';
import {
  TokenInfoQuery,
  useCoinMachineSalePeriodsQuery,
  SalePeriod,
  AnyToken,
} from '~data/index';
import { Address } from '~types/index';
import { getBlockExplorerLink } from '~utils/external';
import { DEFAULT_NETWORK_INFO } from '~constants';

import TokenPriceStatusIcon from '../TokenPriceStatusIcon';
import { PeriodTokensType } from '../RemainingDisplayWidgets';
import SoldTokensWidget from './SoldTokensWidget';

import { getPriceStatus } from '../utils';

import styles from './TokenSalesTable.css';

const MSG = defineMessages({
  tableTitle: {
    id: 'dashboard.CoinMachine.TokenSalesTable.tableTitle',
    defaultMessage: `Previous batches`,
  },
  saleColumnTitle: {
    id: `dashboard.CoinMachine.TokenSalesTable.saleColumnTitle`,
    defaultMessage: 'Sale End',
  },
  amountColumnTitle: {
    id: `dashboard.CoinMachine.TokenSalesTable.amountColumnTitle`,
    defaultMessage: 'Amount {sellableTokenSymbol}',
  },
  priceColumnTitle: {
    id: `dashboard.CoinMachine.TokenSalesTable.priceColumnTitle`,
    defaultMessage: 'Price {purchaseTokenSymbol}',
  },
  noTableData: {
    id: 'dashboard.CoinMachine.TokenSalesTable.noTableData',
    defaultMessage: 'No sales have completed yet.',
  },
  olderPeriodsHidden: {
    id: 'dashboard.CoinMachine.TokenSalesTable.olderPeriodsHidden',
    defaultMessage: `
      The previous sales table has been truncated due to performance reasons.
      You can view older entries manually using {blockExplorerLink}`,
  },
  loading: {
    id: 'dashboard.CoinMachine.TokenSalesTable.loading',
    defaultMessage: 'Loading previous sales table entries...',
  },
});

interface PeriodInfo {
  periodLengthMS: number;
  periodRemainingMS: number;
  targetPerPeriod: string;
  maxPerPeriod: string;
}

interface Props {
  colonyAddress: Address;
  extensionAddress?: Address;
  sellableToken?: TokenInfoQuery['tokenInfo'];
  purchaseToken?: TokenInfoQuery['tokenInfo'];
  periodInfo: PeriodInfo;
}

const displayName = 'dashboard.CoinMachine.TokenSalesTable';

const TokenSalesTable = ({
  colonyAddress,
  extensionAddress,
  sellableToken,
  purchaseToken,
  periodInfo: {
    periodLengthMS,
    periodRemainingMS,
    targetPerPeriod,
    maxPerPeriod,
  },
}: Props) => {
  const PREV_PERIODS_LIMIT = 100;
  const salePeriodQueryVariables = { colonyAddress, limit: PREV_PERIODS_LIMIT };

  const {
    data: salePeriodsData,
    loading: salePeriodsLoading,
    refetch: refetchSalePeriodsData,
    startPolling: startPollingSalePeriodsData,
    stopPolling: stopPollingSalePeriodsData,
  } = useCoinMachineSalePeriodsQuery({
    variables: salePeriodQueryVariables,
  });

  const TABLE_HEADERS = [
    {
      text: MSG.saleColumnTitle,
    },
    {
      text: MSG.amountColumnTitle,
      textValues: {
        sellableTokenSymbol: sellableToken?.symbol,
        span: (chunks) => <span className={styles.tokenSymbol}>{chunks}</span>,
      },
    },
    {
      text: MSG.priceColumnTitle,
      textValues: {
        purchaseTokenSymbol: purchaseToken?.symbol,
        span: (chunks) => <span className={styles.tokenSymbol}>{chunks}</span>,
      },
    },
  ];

  const tableData =
    ((salePeriodsData?.coinMachineSalePeriods as unknown) as SalePeriod[]) ||
    [];

  const formattedData = useMemo(() => {
    return tableData.map(
      ({ saleEndedAt, tokensAvailable, tokensBought, price }) => {
        return {
          saleEndedAt: new Date(parseInt(saleEndedAt, 10)),
          tokensRemaining: (
            <SoldTokensWidget
              tokensBought={tokensBought}
              tokensAvailable={tokensAvailable}
              sellableToken={sellableToken as AnyToken}
            />
          ),
          price: getFormattedTokenValue(price, 18),
          priceStatus: getPriceStatus(
            {
              targetPeriodTokens: bigNumberify(targetPerPeriod),
              maxPeriodTokens: bigNumberify(maxPerPeriod),
            } as PeriodTokensType,
            tokensBought,
          ),
        };
      },
    );
  }, [maxPerPeriod, sellableToken, tableData, targetPerPeriod]);

  /*
   * Manually update the sale table with new data.
   * We do this for two cases:
   * - When each period ticks over
   * - The first time, up to when the period is supposed to finish, in cases
   * where we load the page in the middle of the period
   */
  useEffect(() => {
    if (periodRemainingMS > 1000 && periodRemainingMS < periodLengthMS) {
      setTimeout(() => {
        refetchSalePeriodsData(salePeriodQueryVariables);
        startPollingSalePeriodsData(periodLengthMS);
      }, periodRemainingMS);
    } else {
      startPollingSalePeriodsData(periodLengthMS);
    }
    return () => stopPollingSalePeriodsData();
  }, [
    periodLengthMS,
    periodRemainingMS,
    refetchSalePeriodsData,
    salePeriodQueryVariables,
    startPollingSalePeriodsData,
    stopPollingSalePeriodsData,
  ]);

  return (
    <div className={styles.container}>
      <Heading
        text={MSG.tableTitle}
        appearance={{
          size: 'small',
          theme: 'dark',
        }}
      />
      <div className={styles.tableContainer}>
        <Table className={styles.table} appearance={{ separators: 'none' }}>
          <TableHeader className={styles.tableHeader}>
            <TableRow>
              {TABLE_HEADERS.map((header) => (
                <TableHeaderCell
                  key={header.text.id}
                  className={styles.tableHeaderCell}
                >
                  <FormattedMessage
                    {...header.text}
                    values={header.textValues}
                  />
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!salePeriodsLoading &&
              formattedData.map(
                ({ saleEndedAt, tokensRemaining, price, priceStatus }) => (
                  <TableRow
                    className={styles.tableRow}
                    key={saleEndedAt.getTime()}
                  >
                    <TableCell className={styles.cellData}>
                      <FormattedDate
                        value={saleEndedAt}
                        month="2-digit"
                        day="2-digit"
                        hour12={false}
                        hour="2-digit"
                        minute="2-digit"
                      />
                    </TableCell>
                    <TableCell className={styles.cellData}>
                      {tokensRemaining}
                    </TableCell>
                    <TableCell className={styles.cellData}>
                      {price}
                      {priceStatus && (
                        <TokenPriceStatusIcon status={priceStatus} />
                      )}
                    </TableCell>
                  </TableRow>
                ),
              )}
          </TableBody>
        </Table>
        {!salePeriodsLoading && isEmpty(tableData) && (
          <p className={styles.noDataMessage}>
            <FormattedMessage {...MSG.noTableData} />
          </p>
        )}
        {!salePeriodsLoading && formattedData.length >= PREV_PERIODS_LIMIT && (
          <p className={styles.hiddenDataMessage}>
            <FormattedMessage
              {...MSG.olderPeriodsHidden}
              values={{
                blockExplorerLink: (
                  <ExternalLink
                    href={getBlockExplorerLink({
                      addressOrHash: extensionAddress || '0x',
                    })}
                    text={DEFAULT_NETWORK_INFO.blockExplorerName}
                  />
                ),
              }}
            />
          </p>
        )}
        {salePeriodsLoading && (
          <MiniSpinnerLoader
            className={styles.loading}
            loadingText={MSG.loading}
          />
        )}
      </div>
    </div>
  );
};

TokenSalesTable.displayName = displayName;

export default TokenSalesTable;
