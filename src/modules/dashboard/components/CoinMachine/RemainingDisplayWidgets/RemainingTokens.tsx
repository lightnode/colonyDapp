import React, { useMemo } from 'react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { BigNumber } from 'ethers/utils';

import RemainingTokensValue from './RemainingTokensValue';
import RemainingWidget from './RemainingDisplayWidget';

interface Appearance {
  theme?: 'white' | 'danger';
}

export interface PeriodTokensType {
  decimals: number;
  soldPeriodTokens: BigNumber;
  maxPeriodTokens: BigNumber;
  targetPeriodTokens?: BigNumber;
}

interface Props {
  isTotalSale: boolean;
  appearance?: Appearance;
  tokenAmounts?: PeriodTokensType;
  salePaused?: boolean;
}

const displayName =
  'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens';

const MSG = defineMessages({
  tokensRemainingTitle: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.title',
    defaultMessage: `{isTotalSale, select,
      true {Total}
      false {Batch}
    } sold vs available`,
  },
  tokensRemainingTooltip: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.tooltip',
    // eslint-disable-next-line max-len
    defaultMessage: `This is the number of tokens remaining in the {isTotalSale, select,
      true {sale.}
      false {current batch.}}`,
  },
  tokensTypePlaceholder: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.title',
    defaultMessage: '0',
  },
  soldOut: {
    id: 'dashboard.CoinMachine.RemainingDisplayWidgets.RemainingTokens.soldOut',
    defaultMessage: 'SOLD OUT',
  },
  salePaused: {
    id: `dashboard.CoinMachine.RemainingDisplayWidgets.ReimainingTime.salePaused`,
    defaultMessage: 'Sale ended',
  },
});

const RemainingTokens = ({
  isTotalSale,
  appearance = { theme: 'white' },
  tokenAmounts,
  salePaused = false,
}: Props) => {
  const widgetText = useMemo(() => {
    return {
      title: MSG.tokensRemainingTitle,
      placeholder: MSG.tokensTypePlaceholder,
      tooltipText: MSG.tokensRemainingTooltip,
    };
  }, []);

  const displayedValue = useMemo(() => {
    if (tokenAmounts) {
      return <RemainingTokensValue tokenAmounts={tokenAmounts} />;
    }

    return <FormattedMessage {...widgetText.placeholder} />;
  }, [widgetText, tokenAmounts]);

  const showValueWarning = useMemo(() => {
    if (
      tokenAmounts?.soldPeriodTokens.gt(
        tokenAmounts?.maxPeriodTokens.mul(90).div(100),
      )
    ) {
      return true;
    }

    return false;
  }, [tokenAmounts]);

  return (
    <RemainingWidget
      widgetText={widgetText}
      appearance={appearance}
      isWarning={salePaused ? false : showValueWarning}
      displayedValue={
        salePaused ? (
          <span>
            <FormattedMessage {...MSG.salePaused} />
          </span>
        ) : (
          displayedValue
        )
      }
      isTotalSale={isTotalSale}
    />
  );
};

RemainingTokens.displayName = displayName;

export default RemainingTokens;
