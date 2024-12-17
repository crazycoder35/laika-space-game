import { GameEvent } from './SystemTypes';
import { GameAction } from '../systems/InputSystem';

export interface InputActionStartEvent extends GameEvent {
  type: 'INPUT_ACTION_START';
  payload: {
    action: GameAction;
    source: 'keyboard' | 'mouse' | 'touch';
    key?: string;
    button?: number;
    position?: { x: number; y: number };
  };
}

export interface InputActionEndEvent extends GameEvent {
  type: 'INPUT_ACTION_END';
  payload: {
    action: GameAction;
    source: 'keyboard' | 'mouse' | 'touch';
    key?: string;
    button?: number;
    position?: { x: number; y: number };
  };
}

export interface TouchJoystickEvent extends GameEvent {
  type: 'TOUCH_JOYSTICK';
  payload: {
    x: number;
    y: number;
  };
}

export interface TouchButtonDownEvent extends GameEvent {
  type: 'TOUCH_BUTTON_DOWN';
  payload: {
    action: string;
  };
}

export interface TouchButtonUpEvent extends GameEvent {
  type: 'TOUCH_BUTTON_UP';
  payload: {
    action: string;
  };
}

export interface TouchGestureEvent extends GameEvent {
  type: 'TOUCH_GESTURE';
  payload: {
    gesture: 'tap' | 'swipe' | 'pinch' | 'rotate';
    touches: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    scale?: number;
    rotation?: number;
    position: { x: number; y: number };
  };
}

export interface InputStateChangeEvent extends GameEvent {
  type: 'INPUT_STATE_CHANGE';
  payload: {
    enabled: boolean;
  };
}

export interface InputMappingUpdateEvent extends GameEvent {
  type: 'INPUT_MAPPING_UPDATE';
  payload: {
    keyboard?: Map<string, GameAction>;
    mouse?: Map<number, GameAction>;
    touch?: Map<string, GameAction>;
  };
}

export type InputEvent =
  | InputActionStartEvent
  | InputActionEndEvent
  | TouchJoystickEvent
  | TouchButtonDownEvent
  | TouchButtonUpEvent
  | TouchGestureEvent
  | InputStateChangeEvent
  | InputMappingUpdateEvent;
