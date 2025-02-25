/* @flow strict-local */
import { NativeModules, DeviceEventEmitter, Platform } from 'react-native';

import * as NavigationService from '../nav/NavigationService';
import type { Dispatch, GetState } from '../types';
import type { SharedData } from './types';
import { navigateToSharing } from '../actions';

const Sharing = NativeModules.Sharing ?? {
  readInitialSharedContent: () =>
    // TODO: Implement on iOS.
    null,
};

const goToSharing = (data: SharedData) => (dispatch: Dispatch, getState: GetState) => {
  NavigationService.dispatch(navigateToSharing(data));
};

export const handleInitialShare = async (dispatch: Dispatch) => {
  const initialSharedData: SharedData | null = await Sharing.readInitialSharedContent();
  if (initialSharedData !== null) {
    dispatch(goToSharing(initialSharedData));
  }
};

export class ShareReceivedListener {
  dispatch: Dispatch;
  unsubs: Array<() => void> = [];

  constructor(dispatch: Dispatch) {
    this.dispatch = dispatch;
  }

  /** Private. */
  listen(name: string, handler: (...empty) => void | Promise<void>) {
    if (Platform.OS === 'android') {
      const subscription = DeviceEventEmitter.addListener(name, handler);
      this.unsubs.push(() => subscription.remove());
    }
  }

  /** Private. */
  unlistenAll() {
    while (this.unsubs.length > 0) {
      this.unsubs.pop()();
    }
  }

  handleShareReceived: SharedData => void = data => {
    this.dispatch(goToSharing(data));
  };

  /** Start listening.  Don't call twice without intervening `stop`. */
  start() {
    if (Platform.OS === 'android') {
      this.listen('shareReceived', this.handleShareReceived);
    }
  }

  /** Stop listening. */
  stop() {
    this.unlistenAll();
  }
}
