import { Accelerator } from './keys';
import { BrowserWindow, Input, Event, WebContents } from 'electron';

const localShortcutMap: Record<
  string,
  [(_: Event, i: Input) => void, WebContents]
> = {};

export const getShortcutLocal = <S extends string>(
  accelerator: Accelerator<S>,
  webContents: Electron.WebContents,
): [(_: Event, i: Input) => void, WebContents] =>
  localShortcutMap[`${accelerator}-${webContents.id}`];

export const setShortcutLocal = <S extends string>(
  accelerator: Accelerator<S>,
  webContents: Electron.WebContents,
  handler: (_: Event, i: Input) => void,
): void => {
  localShortcutMap[`${accelerator}-${webContents.id}`] = [handler, webContents];
};

export const deleteShortcutLocal = <S extends string>(
  accelerator: Accelerator<S>,
  webContents: Electron.WebContents,
): void => {
  delete localShortcutMap[`${accelerator}-${webContents.id}`];
};

const allShortcutMap: Record<string, (_: Event, w: BrowserWindow) => void> = {};

export const getShortcutOnAll = <S extends string>(
  accelerator: Accelerator<S>,
): ((_: Event, w: BrowserWindow) => void) => allShortcutMap[accelerator];

export const setShortcutOnAll = <S extends string>(
  accelerator: Accelerator<S>,
  handler: (_: Event, w: BrowserWindow) => void,
): void => {
  allShortcutMap[accelerator] = handler;
};

export const deleteShortcutOnAll = <S extends string>(
  accelerator: Accelerator<S>,
): void => {
  delete allShortcutMap[accelerator];
};

const globalShortcutMap: Record<string, (_: Event, w: BrowserWindow) => void> =
  {};

export const getShortcutGlobal = <S extends string>(
  accelerator: Accelerator<S>,
): ((_: Event, w: BrowserWindow) => void) => globalShortcutMap[accelerator];

export const setShortcutGlobal = <S extends string>(
  accelerator: Accelerator<S>,
  handler: (_: Event, w: BrowserWindow) => void,
): void => {
  globalShortcutMap[accelerator] = handler;
};

export const deleteShortcutGlobal = <S extends string>(
  accelerator: Accelerator<S>,
): void => {
  delete globalShortcutMap[accelerator];
};
