/* @flow */

import React from 'react';
import { defineMessages } from 'react-intl';

import { stripProtocol } from '~utils/strings';
import { useDataFetcher } from '~utils/hooks';

import type { ColonyType, RolesType } from '~immutable';

import Heading from '~core/Heading';
import Icon from '~core/Icon';
import Link from '~core/Link';
import ExternalLink from '~core/ExternalLink';
import HookedColonyAvatar from '~dashboard/HookedColonyAvatar';
import HookedUserAvatar from '~users/HookedUserAvatar';
import ColonySubscribe from './ColonySubscribe.jsx';

import { rolesFetcher } from '../../../fetchers';

import { multiLineTextEllipsis } from '~utils/strings';

import styles from './ColonyMeta.css';

const MSG = defineMessages({
  websiteLabel: {
    id: 'dashboard.ColonyHome.ColonyMeta.websiteLabel',
    defaultMessage: 'Website',
  },
  guidelineLabel: {
    id: 'dashboard.ColonyHome.ColonyMeta.guidelineLabel',
    defaultMessage: 'Contribute Guidelines',
  },
  founderLabel: {
    id: 'dashboard.ColonyHome.ColonyMeta.founderLabel',
    defaultMessage: 'Colony Founder',
  },
  adminsLabel: {
    id: 'dashboard.ColonyHome.ColonyMeta.adminsLabel',
    defaultMessage: 'Colony Admins',
  },
  editColonyTitle: {
    id: 'dashboard.ColonyHome.ColonyMeta.editColonyTitle',
    defaultMessage: 'Edit Colony',
  },
});

const ColonyAvatar = HookedColonyAvatar({ fetchColony: false });
const UserAvatar = HookedUserAvatar();

type Props = {|
  colony: ColonyType,
  canAdminister: boolean,
|};

const ColonyMeta = ({
  colony: {
    colonyAddress,
    description,
    colonyName,
    guideline,
    displayName,
    website,
  },
  colony,
  canAdminister,
}: Props) => {
  const { data: roles } = useDataFetcher<RolesType>(
    rolesFetcher,
    [colonyAddress],
    [colonyAddress],
  );
  const { admins, founder } = roles || {};

  return (
    <div className={styles.main}>
      <div className={styles.colonyAvatar}>
        <ColonyAvatar
          className={styles.avatar}
          colonyAddress={colonyAddress}
          colony={colony}
          size="xl"
        />
        <ColonySubscribe colonyAddress={colonyAddress} />
      </div>
      <section className={styles.headingWrapper}>
        <Heading appearance={{ margin: 'none', size: 'medium', theme: 'dark' }}>
          <>
            <span title={displayName}>
              {/*
               * @NOTE We need to use a JS string truncate here, rather then CSS as we do with the other fields,
               * since we also have to show the settings icon, after the truncated name, otherwise the icon
               * will be hidden with the rest of the text
               *
               * To fix this properly (ie: without JS), we'll need a re-design
               */
              multiLineTextEllipsis(displayName, 65)}
            </span>
            {canAdminister && (
              <Link
                className={styles.editColony}
                to={`/colony/${colonyName}/admin`}
              >
                <Icon name="settings" title={MSG.editColonyTitle} />
              </Link>
            )}
          </>
        </Heading>
      </section>
      {description && (
        <section className={styles.description}>
          <p>{description}</p>
        </section>
      )}
      {website && (
        <section className={styles.dynamicTextSection}>
          <Heading
            appearance={{ margin: 'none', size: 'small', theme: 'dark' }}
            text={MSG.websiteLabel}
          />
          <span title={stripProtocol(website)}>
            <ExternalLink href={stripProtocol(website)} />
          </span>
        </section>
      )}
      {guideline && (
        <section className={styles.dynamicTextSection}>
          <Heading
            appearance={{ margin: 'none', size: 'small', theme: 'dark' }}
            text={MSG.guidelineLabel}
          />
          <span title={stripProtocol(guideline)}>
            <ExternalLink href={stripProtocol(guideline)} />
          </span>
        </section>
      )}
      {founder && (
        <section className={styles.dynamicSection}>
          <Heading
            appearance={{ margin: 'none', size: 'small', theme: 'dark' }}
            text={MSG.founderLabel}
          />
          <UserAvatar
            key={`founder_${founder}`}
            address={founder}
            className={styles.userAvatar}
            showInfo
            showLink
          />
        </section>
      )}
      {admins && admins.length ? (
        <section className={styles.dynamicSection}>
          <Heading
            appearance={{ margin: 'none', size: 'small', theme: 'dark' }}
            text={MSG.adminsLabel}
          />
          {admins.map((adminAddress: string) => (
            <UserAvatar
              key={`admin_${adminAddress}`}
              address={adminAddress}
              className={styles.userAvatar}
              showInfo
              showLink
            />
          ))}
        </section>
      ) : null}
    </div>
  );
};

ColonyMeta.displayName = 'dashboard.ColonyHome.ColonyMeta';

export default ColonyMeta;
