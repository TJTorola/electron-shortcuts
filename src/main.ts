import { Accelerator, RegisterOptions } from './keys';
import { BrowserWindow, Input, Event, app, globalShortcut } from 'electron';
import {
  constVoid,
  split,
  normalizeModifiers,
  normalizedModifierToInputProperty,
  normalizeNonModifier,
} from './utils';
import { inputProperties } from './input';
import {
  deleteShortcutLocal,
  deleteShortcutOnAll,
  deleteShortcutGlobal,
  getShortcutLocal,
  getShortcutOnAll,
  getShortcutGlobal,
  setShortcutLocal,
  setShortcutOnAll,
  setShortcutGlobal,
} from './cache';

export const isRegisteredLocal = <S extends string>(
  accelerator: Accelerator<S>,
  webContents: Electron.WebContents,
): boolean => {
  return !!getShortcutLocal(accelerator, webContents);
};

export const isRegisteredOnAll = <S extends string>(
  accelerator: Accelerator<S>,
): boolean => {
  return !!getShortcutOnAll(accelerator);
};

export const isRegisteredGlobal = <S extends string>(
  accelerator: Accelerator<S>,
): boolean => {
  return !!getShortcutGlobal(accelerator);
};

// Register a local shortcut for the given
// accelerator string on the given window
export const register = <S extends string>(
  accelerator: Accelerator<S>,
  f: () => void,
  wc: Electron.WebContents,
  options?: RegisterOptions,
): void => {
  // `strict` is false if not specified
  const strict = options?.strict || false;

  // Break down the accelerator into modifiers and non-modifiers,
  // then, find the associated input properties
  const [modifiers, [nonModifier]] = split(accelerator);

  const inputModifiers = normalizeModifiers(modifiers).map(
    normalizedModifierToInputProperty,
  );
  const normalizedNonModifier = normalizeNonModifier(nonModifier);

  // The modifiers check to perform when `strict` is enabled
  const modifiersCheckStrict = (i: Input): boolean => {
    const excessInputProperties = inputProperties.filter(
      (p) => !inputModifiers.includes(p),
    );

    return (
      modifiersCheckNonStrict(i) &&
      excessInputProperties.every((mod) => !i[mod])
    );
  };

  // The modifiers check to perform when `strict` is not enabled
  const modifiersCheckNonStrict = (i: Input): boolean =>
    inputModifiers.every((mod) => i[mod]);

  const modifiersCheck: (i: Input) => boolean = strict
    ? modifiersCheckStrict
    : modifiersCheckNonStrict;

  // Ignore key up events, and perform the relevant checks
  // on key down events
  const onKeyUp = (): void => constVoid();
  const onKeyDown = (input: Input): void => {
    return input.key.toLowerCase() === normalizedNonModifier.toLowerCase() &&
      modifiersCheck(input)
      ? f()
      : constVoid();
  };

  // Actual handler to attach to the webContents
  const handler = (_: Event, i: Input): void =>
    i.type === 'keyUp' ? onKeyUp() : onKeyDown(i);

  // If there was a previous shortcut registed with the same accelerator
  // on the same window, override it
  const unregisterPreviousIfNeeded = (wc: Electron.WebContents) =>
    isRegisteredLocal(accelerator, wc)
      ? unregister(accelerator, wc)
      : constVoid();

  // Actual registration process
  const register = (wc: Electron.WebContents): void => {
    unregisterPreviousIfNeeded(wc);

    // Keep reference to local shortcut in case we need to
    // unregister it later
    setShortcutLocal(accelerator, wc, handler);

    // Attach listener to webContents of the window
    wc.on('before-input-event', handler);
  };

  return register(wc);
};

// Register a local shortcut for the given
// accelerator on all current and future windows
export const registerOnAll = <S extends string>(
  accelerator: Accelerator<S>,
  f: () => void,
  options?: RegisterOptions,
): void => {
  const windows = BrowserWindow.getAllWindows();

  // Handler to register the shortcut for new windows
  const handler = (_: Event, w: BrowserWindow): void =>
    register(accelerator, f, w.webContents, options);

  // Register shortcut for new windows
  app.on('browser-window-created', handler);

  // Keep reference to global shortcut in case
  // we need to unregister it later
  setShortcutOnAll(accelerator, handler);

  return windows.forEach((win) =>
    register(accelerator, f, win.webContents, options),
  );
};

// Unregister the given shortcut from the given window
export const unregister = <S extends string>(
  accelerator: Accelerator<S>,
  webContents: Electron.WebContents,
): void => {
  const handler = getShortcutLocal(accelerator, webContents)?.[0];

  const doUnregister = () => {
    webContents.removeListener('before-input-event', handler);
    deleteShortcutLocal(accelerator, webContents);
  };

  !!webContents ? doUnregister() : constVoid();
};

// Unregister the given shortcut from all current
// and future windows
export const unregisterOnAll = <S extends string>(
  accelerator: Accelerator<S>,
): void => {
  const windows = BrowserWindow.getAllWindows();
  const globalHandler = getShortcutOnAll(accelerator);

  const doUnregister = () => {
    app.removeListener('browser-window-created', globalHandler);
    deleteShortcutOnAll(accelerator);
  };

  !!globalHandler ? doUnregister() : constVoid();

  return windows.forEach((win) => unregister(accelerator, win.webContents));
};

// Register a global shortcut for the given
// accelerator string on the given window
export const registerGlobal = <S extends string>(
  accelerator: Accelerator<S>,
  f: () => void,
): void => {
  // If there was a previous global shortcut registed with the same
  // accelerator, override it
  const unregisterPreviousIfNeeded = () =>
    isRegisteredGlobal(accelerator)
      ? unregisterGlobal(accelerator)
      : constVoid();

  const doRegisterGlobal = () => {
    unregisterPreviousIfNeeded();
    setShortcutGlobal(accelerator, f);
    globalShortcut.register(accelerator, f);
  };

  return doRegisterGlobal();
};

// Unregister the given global shortcut
export const unregisterGlobal = <S extends string>(
  accelerator: Accelerator<S>,
): void => {
  const doUnregister = () => {
    deleteShortcutGlobal(accelerator);
    globalShortcut.unregister(accelerator);
  };

  return doUnregister();
};
