import * as yup from 'yup';
import { Extension } from '@colony/colony-js';

import { ExtensionInitParams } from '~data/staticData/extensionData';
import { useMetaColonyQuery } from '~data/index';

export const createExtensionInitValidation = (
  initializationParams: ExtensionInitParams[],
) => {
  if (!initializationParams) {
    return null;
  }
  const validationObject = initializationParams.reduce((validation, param) => {
    // eslint-disable-next-line no-param-reassign
    validation[param.paramName] = param.validation;
    return validation;
  }, {});
  return yup.object().shape(validationObject);
};

export const createExtensionDefaultValues = (
  initializationParams: ExtensionInitParams[],
) => {
  if (!initializationParams) {
    return null;
  }
  return initializationParams.reduce((defaultValues, param) => {
    // eslint-disable-next-line no-param-reassign
    defaultValues[param.paramName] = param.defaultValue;
    return defaultValues;
  }, {});
};

export const useExtensionAvailable = (colonyAddress: string) => {
  const { data: metaColonyData } = useMetaColonyQuery();
  const availableExtensionFilter = (extensionName: string) => {
    if (
      extensionName === Extension.CoinMachine ||
      extensionName === Extension.Whitelist
    ) {
      if (
        colonyAddress === metaColonyData?.processedMetaColony?.colonyAddress
      ) {
        return true;
      }
      return false;
    }
    return true;
  };
  return { availableExtensionFilter };
};
