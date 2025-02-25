/* @flow strict-local */
import { streamNarrow } from '../../utils/narrow';
import { getMessageUpdateStrategy } from '../messageUpdates';

import * as eg from '../../__tests__/lib/exampleData';

const someNarrow = streamNarrow(eg.stream.name);
const anotherNarrow = streamNarrow(eg.makeStream().name);

describe('getMessageUpdateStrategy', () => {
  test('initial load positions at anchor (first unread)', () => {
    const prevProps = {
      messages: [],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 1 }, { id: 2 }, { id: 3 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('scroll-to-anchor');
  });

  test('switching narrows position at anchor (first unread)', () => {
    const prevProps = {
      messages: [{ id: 1 }, { id: 2 }, { id: 3 }],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 2 }, { id: 3 }, { id: 5 }, { id: 6 }],
      narrow: anotherNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('scroll-to-anchor');
  });

  test('when no messages just replace content', () => {
    const prevProps = {
      messages: [],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [],
      narrow: anotherNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('replace');
  });

  test('when messages replaced go to anchor', () => {
    const prevProps = {
      messages: [{ id: 1 }, { id: 2 }, { id: 3 }],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 5 }, { id: 6 }, { id: 7 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('scroll-to-anchor');
  });

  // (It's not clear this test case makes sense.)
  test('when older messages loaded (plus one lost) preserve scroll position', () => {
    const prevProps = {
      messages: [{ id: 2 }, { id: 3 }, { id: 4 }],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 0 }, { id: 1 }, { id: 3 }, { id: 4 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('preserve-position');
  });

  test('when older messages loaded preserve scroll position', () => {
    const prevProps = {
      messages: [{ id: 4 }, { id: 5 }, { id: 6 }],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('preserve-position');
  });

  test('when newer messages loaded preserve scroll position', () => {
    const prevProps = {
      messages: [{ id: 4 }, { id: 5 }, { id: 6 }],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('preserve-position');
  });

  test('if only one new message scroll to bottom if near bottom', () => {
    const prevProps = {
      messages: [{ id: 4 }, { id: 5 }, { id: 6 }],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('scroll-to-bottom-if-near-bottom');
  });

  test('when loading new messages, scroll to anchor', () => {
    const prevProps = {
      messages: [],
      narrow: someNarrow,
    };
    const nextProps = {
      messages: [{ id: 1 }, { id: 2 }, { id: 3 }],
      narrow: someNarrow,
    };

    const result = getMessageUpdateStrategy(prevProps, nextProps);

    expect(result).toEqual('scroll-to-anchor');
  });
});
