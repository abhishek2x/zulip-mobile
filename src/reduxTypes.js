/**
 * Types describing our Redux state and store.
 *
 * This isn't the place for types that are borrowed from the API;
 * those go under `src/api/` (typically in `src/api/modelTypes.js`)
 * and can be imported here as needed.
 *
 * @flow strict-local
 */
import type Immutable from 'immutable';
import type { InputSelector } from 'reselect';

import type { Account, Outbox } from './types';
import type { Action } from './actionTypes';
import type {
  Topic,
  Message,
  MuteTuple,
  CrossRealmBot,
  RealmEmojiById,
  RealmFilter,
  Stream,
  Subscription,
  User,
  UserGroup,
  UserId,
  UserPresence,
  UserStatusMapObject,
} from './api/apiTypes';
import type { SessionState } from './session/sessionReducer';
import type { PmConversationsState } from './pm-conversations/pmConversationsModel';
import type { UnreadState } from './unread/unreadModelTypes';

export type * from './actionTypes';

/**
 * The list of known accounts, with the active account first.
 *
 * Some accounts in the list may have a blank API key (if the user hasn't
 * yet completed login, or has logged out) or even a blank email (if the
 * user hasn't completed login.)
 *
 * See:
 *  * "active account" in `docs/glossary.md`.
 *  * `getIdentity`, `getAuth`, and related selectors, for getting
 *    information about the active account as needed in most codepaths of
 *    the app.
 *  * `Account` for details on the properties of each account object.
 */
export type AccountsState = $ReadOnlyArray<Account>;

export type AlertWordsState = $ReadOnlyArray<string>;

/**
 * Info about how complete our knowledge is of the messages in some narrow.
 *
 * @prop older - true just if in some fetch we reached the oldest message
 *   in the narrow.  No need to fetch more in that direction.
 * @prop newer - true just if in some fetch we reached the newest message in
 *   the narrow.  Of course their may always be new messages, but we should
 *   learn about them through events; so again, no need to fetch more.
 */
export type CaughtUp = $ReadOnly<{|
  older: boolean,
  newer: boolean,
|}>;

/**
 * Info about how completely we know the messages in each narrow.
 *
 * The keys correspond to the keys in `NarrowsState`.
 *
 * See `CaughtUp` for details on what each value means.
 */
export type CaughtUpState = $ReadOnly<{|
  [narrow: string]: CaughtUp,
|}>;

/**
 * The user's draft message, if any, in each conversation.
 *
 * The keys correspond to the keys in `NarrowsState`.
 */
export type DraftsState = $ReadOnly<{|
  [narrow: string]: string,
|}>;

export type Fetching = $ReadOnly<{|
  older: boolean,
  newer: boolean,
|}>;

/**
 * Info about which narrows we're actively fetching more messages from.
 *
 * The keys correspond to the keys in `NarrowsState`.
 *
 * See also: `CaughtUpState`, `NarrowsState`.
 */
export type FetchingState = $ReadOnly<{|
  [narrow: string]: Fetching,
|}>;

/**
 * The message flags corresponding to all the messages in `MessagesState`.
 *
 * Unlike almost all other subtrees of our state, this one can be
 * incomplete, always in exactly the same way that `MessagesState` is.
 *
 * We expect most of these flags to be very sparse: the number of messages
 * you have starred, or where you're @-mentioned, is typically a very small
 * fraction of the total number of messages you have. That's why it probably
 * doesn't make sense for this data structure to explicitly indicate "not
 * starred", "not @-mentioned", etc., for every known message. That could
 * significantly increase the memory and storage requirement when we know
 * about a lot of messages. If we need to distinguish "unknown message" from
 * "message without flag", we can look up the message ID in
 * `state.messages`.
 */
export type FlagsState = $ReadOnly<{|
  read: {| +[messageId: number]: true |},
  starred: {| +[messageId: number]: true |},
  collapsed: {| +[messageId: number]: true |},
  mentioned: {| +[messageId: number]: true |},
  wildcard_mentioned: {| +[messageId: number]: true |},
  summarize_in_home: {| +[messageId: number]: true |},
  summarize_in_stream: {| +[messageId: number]: true |},
  force_expand: {| +[messageId: number]: true |},
  force_collapse: {| +[messageId: number]: true |},
  has_alert_word: {| +[messageId: number]: true |},
  historical: {| +[messageId: number]: true |},
  is_me_message: {| +[messageId: number]: true |},
|}>;

export type FlagName = $Keys<FlagsState>;

/**
 * A map with all messages we've stored locally, indexed by ID.
 *
 * For almost all types of data we need from the server, we use the Zulip
 * event system to get a complete snapshot and to maintain it incrementally.
 * See `doInitialFetch` for discussion, and see our docs from the
 * client-side perspective:
 *   https://github.com/zulip/zulip-mobile/blob/master/docs/architecture/realtime.md
 * and a mainly server-side perspective:
 *   https://zulip.readthedocs.io/en/latest/subsystems/events-system.html
 * As a result, there are very few types of data we need to go fetch from
 * the server as the user navigates through the app or as different
 * information is to appear on screen.
 *
 * Message data is the one major exception.  For new messages while we're
 * online, and updates to existing messages, we learn them in real time
 * through the event system; but because the full history of messages can be
 * very large, it's left out of the snapshot obtained through `/register` by
 * `doInitialFetch`.  Instead, we fetch specific message history as needed.
 *
 * This subtree of our state stores all the messages we've fetched, prompted
 * by any of a variety of reasons.
 *
 * Although this map is *incomplete*, it should always be *accurate* about
 * each message it does contain -- once a message appears here, we use the
 * Zulip event system to make sure it stays up to date through edits, emoji
 * reactions, or other changes to its data.
 *
 * These `Message` objects lack the `flags` property; we store that
 * information separately, as `FlagsState`.
 *
 * See also `NarrowsState`, which is an index on this data that identifies
 * messages belonging to a given narrow.
 */
export type MessagesState = Immutable.Map<number, Message>;

export type MigrationsState = $ReadOnly<{|
  version?: string,
|}>;

export type MuteState = $ReadOnlyArray<MuteTuple>;

/** A map from user IDs to the Unix timestamp in seconds when they were muted. */
export type MutedUsersState = Immutable.Map<UserId, number>;

/**
 * An index on `MessagesState`, listing messages in each narrow.
 *
 * Unlike almost all other subtrees of our state, this one can be incomplete
 * compared to the data that exists on the server and the user has access
 * to; see `MessagesState` for more context.  The data here should
 * correspond exactly to the data in `MessagesState`.
 *
 * Keys are those given by `keyFromNarrow`.
 * Values are sorted lists of message IDs.
 *
 * See also:
 *  * `MessagesState`, which stores the message data indexed by ID;
 *  * `CaughtUpState` for information about where this data *is*
 *    complete for a given narrow;
 *  * `FetchingState` for information about which narrows we're actively
 *    fetching more messages from.
 */
export type NarrowsState = Immutable.Map<string, number[]>;

export type OutboxState = $ReadOnlyArray<Outbox>;

/**
 * The `presence` subtree of our Redux state.
 *
 * @prop (email) - Indexes over all users for which the app has received a
 *   presence status.
 */
export type PresenceState = $ReadOnly<{|
  [email: string]: UserPresence,
|}>;

/**
 * Configuration for a video chat provider, as specified by the server.
 *
 * The `name` property identifies the selected provider.  Depending on the
 * provider, other properties may provide other configuration details
 * required.
 *
 * See `src/realm/realmReducer.js` for where these values are produced based
 * on information from the server.
 */
// Right now there's just one branch here; if we add another provider, this
// should become a disjoint union on `name`.
export type VideoChatProvider = $ReadOnly<{| name: 'jitsi_meet', jitsiServerUrl: string |}>;

/**
 * State with miscellaneous data from the server; our state subtree `realm`.
 *
 * Despite the name, this info doesn't necessarily have much to do with the
 * Zulip organization/realm; some properties do, but others are per-user,
 * and others are per-server.
 *
 * About the server:
 * @prop crossRealmBots - The server's cross-realm bots; e.g., Welcome Bot.
 *   Cross-realm bots should be treated like normal bots.
 *
 * About the org/realm:
 * @prop nonActiveUsers - All users in the organization with `is_active`
 *   false; for normal users, this means they or an admin deactivated their
 *   account.  See `User` and the linked documentation.
 * @prop filters
 * @prop emoji
 * @prop videoChatProvider - The video chat provider configured by the
 *   server; null if none, or if the configured provider is one we don't
 *   support.
 *
 * About the user:
 * @prop email
 * @prop user_id
 * @prop twentyFourHourTime
 * @prop canCreateStreams
 * @prop isAdmin
 */
export type RealmState = $ReadOnly<{|
  crossRealmBots: $ReadOnlyArray<CrossRealmBot>,

  nonActiveUsers: $ReadOnlyArray<User>,
  filters: $ReadOnlyArray<RealmFilter>,
  emoji: RealmEmojiById,
  videoChatProvider: VideoChatProvider | null,

  email: string | void,
  user_id: UserId | void,
  twentyFourHourTime: boolean,
  canCreateStreams: boolean,
  isAdmin: boolean,
|}>;

// TODO: Stop using the 'default' name. Any 'default' semantics should
// only apply the device level, not within the app. See
// https://github.com/zulip/zulip-mobile/issues/4009#issuecomment-619280681.
export type ThemeName = 'default' | 'night';

/** What browser the user has set to use for opening links in messages.
 *
 * * embedded: The in-app browser
 * * external: The user's default browser app
 * * default: 'external' on iOS, 'embedded' on Android
 *
 * Use the `shouldUseInAppBrowser` function from src/utils/openLink.js in order to
 * parse this.
 *
 * See https://chat.zulip.org/#narrow/stream/48-mobile/topic/in-app.20browser
 * for the reasoning behind these options.
 */
export type BrowserPreference = 'embedded' | 'external' | 'default';

export type SettingsState = $ReadOnly<{|
  // The user's chosen language, as an IETF BCP 47 language tag.
  language: string,

  theme: ThemeName,
  offlineNotification: boolean,
  onlineNotification: boolean,
  experimentalFeaturesEnabled: boolean,
  streamNotification: boolean,
  browser: BrowserPreference,
  doNotMarkMessagesAsRead: boolean,
|}>;

export type StreamsState = $ReadOnlyArray<Stream>;

export type SubscriptionsState = $ReadOnlyArray<Subscription>;

export type TopicsState = $ReadOnly<{|
  [number]: $ReadOnlyArray<Topic>,
|}>;

export type TypingState = $ReadOnly<{|
  [normalizedRecipients: string]: $ReadOnly<{|
    time: number,
    userIds: $ReadOnlyArray<UserId>,
  |}>,
|}>;

export type UserGroupsState = $ReadOnlyArray<UserGroup>;

export type UserStatusState = UserStatusMapObject;

/**
 * A collection of (almost) all users in the Zulip org; our `users` state subtree.
 *
 * This contains all users except deactivated users and cross-realm bots.
 * For those, see RealmState.
 */
export type UsersState = $ReadOnlyArray<User>;

/**
 * Our complete Redux state tree.
 *
 * Each property is a subtree maintained by its own reducer function.  These
 * are named in a regular pattern; see also `src/boot/reducers.js`.
 *
 * We use `redux-persist` to write parts of this state tree to persistent
 * device storage that survives when the app is closed, and to read it back
 * ("rehydrate" it) from that storage at launch time.  See `src/boot/store.js`.
 * Other parts of the state tree are not persisted.
 *
 * See in particular `discardKeys`, `storeKeys`, and `cacheKeys`, which
 * identify which subtrees are persisted and which are not.
 */
export type GlobalState = $ReadOnly<{|
  accounts: AccountsState,
  alertWords: AlertWordsState,
  caughtUp: CaughtUpState,
  drafts: DraftsState,
  fetching: FetchingState,
  flags: FlagsState,
  messages: MessagesState,
  migrations: MigrationsState,
  mute: MuteState,
  mutedUsers: MutedUsersState,
  narrows: NarrowsState,
  outbox: OutboxState,
  pmConversations: PmConversationsState,
  presence: PresenceState,
  realm: RealmState,
  session: SessionState,
  settings: SettingsState,
  streams: StreamsState,
  subscriptions: SubscriptionsState,
  topics: TopicsState,
  typing: TypingState,
  unread: UnreadState,
  userGroups: UserGroupsState,
  userStatus: UserStatusState,
  users: UsersState,
|}>;

// No substate should allow `undefined`; our use of AsyncStorage
// depends on it. (This check will also complain on `null`, which I
// don't think we'd have a problem with. We could try to write this
// differently if we want to allow `null`.)
type NonMaybeProperties<O: { ... }> = $ObjMap<O, <V>(V) => $NonMaybeType<V>>;
type NonMaybeGlobalState = NonMaybeProperties<GlobalState>;
// This function definition will fail typechecking if GlobalState is wrong.
(s: GlobalState): NonMaybeGlobalState => s; // eslint-disable-line no-unused-expressions

/** A selector returning TResult, with extra parameter TParam. */
// Seems like this should be OutputSelector... but for whatever reason,
// putting that on a selector doesn't cause the result type to propagate to
// the corresponding parameter when used in `createSelector`, and this does.
export type Selector<TResult, TParam = void> = InputSelector<GlobalState, TParam, TResult>;

export type GetState = () => GlobalState;

export type PlainDispatch = <A: Action>(action: A) => A;

export interface Dispatch {
  <A: Action>(action: A): A;
  <T>(ThunkAction<T>): T; // eslint-disable-line no-use-before-define
}

export type ThunkAction<T> = (Dispatch, GetState) => T;
