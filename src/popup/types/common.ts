/**
 * Common types for popup UI components
 * 
 * Provides reusable type definitions for events, callbacks, and component props.
 */

import React from "react";

// ============ Event Types ============

/** Input change event type */
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;

/** Textarea change event type */
export type TextareaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;

/** Select change event type */
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;

/** Form submit event type */
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>;

/** Mouse click event type */
export type MouseClickEvent = React.MouseEvent<HTMLElement>;

/** Keyboard event type */
export type KeyboardEvent = React.KeyboardEvent<HTMLElement>;

// ============ Callback Types ============

/** Simple void callback */
export type VoidCallback = () => void;

/** Callback with index */
export type IndexCallback = (index: number) => void;

/** Callback with string */
export type StringCallback = (value: string) => void;

// ============ Process View Types ============

/** Props for process step views (CreatePwdView, MnemonicView, etc.) */
export interface ProcessViewProps {
  onClickNext?: VoidCallback;
  onClickNextTab?: VoidCallback;
  onClickPre?: VoidCallback;
  onClickPreTab?: VoidCallback;
}

/** Props for RestoreMneView */
export interface RestoreMneViewProps extends ProcessViewProps {
  onSwitchMneCount?: (is24Words: boolean) => void;
}

// ============ Mnemonic Types ============

/** Mnemonic word item for selection UI */
export interface MneWordItem {
  name: string;
  selected: boolean;
}

/** Props for MneItemSelectedV2 component */
export interface MneItemSelectedProps {
  mne: string;
  index?: number;
  onClick?: VoidCallback;
}
