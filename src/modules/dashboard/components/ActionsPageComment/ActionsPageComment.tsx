import React, { useCallback, KeyboardEvent, SyntheticEvent } from 'react';
import * as yup from 'yup';
import { FormikProps, FormikBag } from 'formik';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Form, TextareaAutoresize } from '~core/Fields';

import {
  useSendTransactionMessageMutation,
  TransactionMessagesDocument,
  TransactionQueryVariables,
} from '~data/index';
import { Address, ENTER } from '~types/index';

import styles from './ActionsPageComment.css';

const displayName = 'dashboard.ActionsPageComment';

const MSG = defineMessages({
  commentInputPlaceholder: {
    id: 'dashboard.ActionsPageComment.commentInputPlaceholder',
    defaultMessage: 'What would you like to say?',
  },
  commentInstuctions: {
    id: 'dashboard.ActionsPageComment.commentInstuctions',
    defaultMessage: `{sendCombo} to send {newLineCombo} for a new line`,
  },
  sendCombo: {
    id: 'dashboard.ActionsPageComment.sendCombo',
    defaultMessage: `{isMac, select,
      true {⌘}
      other {Ctrl}
    }+Return`,
  },
  newLineCombo: {
    id: 'dashboard.ActionsPageComment.newLineCombo',
    defaultMessage: 'Return',
  },
});

/*
 * This a poor man's way of detecting the Mac os platform (even though
 * it has a bit of future proofing baked in), but it's a good alternative for
 * now, until we have time to come back and make a proper detector.
 */
const isMac: boolean = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const validationSchema = yup.object().shape({
  message: yup.string().trim().min(3).required(),
});

type FormValues = {
  message: string;
};

interface Props {
  transactionHash: string;
  colonyAddress: Address;
}

const handleKeyboardSubmit = (
  capturedEvent: KeyboardEvent<any>,
  callback: (e: SyntheticEvent<any>) => any,
) => {
  const { key, ctrlKey, metaKey } = capturedEvent;

  /*
   * The meta key is interpreted on MacOS as the command ⌘ key
   */
  if ((ctrlKey || metaKey) && key === ENTER) {
    capturedEvent.preventDefault();
    return callback(capturedEvent);
  }
  return false;
};

const ActionsPageComment = ({ transactionHash, colonyAddress }: Props) => {
  const [sendTransactionMessage] = useSendTransactionMessageMutation();

  const onSubmit = useCallback(
    ({ message }: FormValues, { resetForm }: FormikBag<object, FormValues>) =>
      sendTransactionMessage({
        variables: {
          input: {
            transactionHash,
            message,
            colonyAddress,
          },
        },
        refetchQueries: [
          {
            query: TransactionMessagesDocument,
            variables: { transactionHash } as TransactionQueryVariables,
          },
        ],
      }).then(() => resetForm()),
    [transactionHash, colonyAddress, sendTransactionMessage],
  );

  return (
    <div className={styles.main}>
      <Form
        initialValues={{ message: '' }}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount
      >
        {({ isSubmitting, isValid, handleSubmit }: FormikProps<FormValues>) => (
          <div className={styles.commentBox}>
            <TextareaAutoresize
              elementOnly
              label={MSG.commentInputPlaceholder}
              name="message"
              placeholder={MSG.commentInputPlaceholder}
              minRows={1}
              maxRows={6}
              onKeyDown={(event) => handleKeyboardSubmit(event, handleSubmit)}
            />
            <div
              className={
                isValid
                  ? styles.sendInstructionsFadeIn
                  : styles.sendInstructions
              }
            >
              <FormattedMessage
                {...MSG.commentInstuctions}
                values={{
                  sendCombo: (
                    <b>
                      <FormattedMessage {...MSG.sendCombo} values={{ isMac }} />
                    </b>
                  ),
                  newLineCombo: (
                    <b>
                      <FormattedMessage {...MSG.newLineCombo} />
                    </b>
                  ),
                }}
              />
            </div>
          </div>
        )}
      </Form>
    </div>
  );
};

ActionsPageComment.displayName = displayName;

export default ActionsPageComment;
