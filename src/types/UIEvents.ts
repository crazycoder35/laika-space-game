import { GameEvent } from './SystemTypes';
import { Vector2D } from '../core/components/TransformComponent';

export interface UIButtonClickEvent extends GameEvent {
  type: 'UI_BUTTON_CLICK';
  payload: {
    id: string;
    position?: Vector2D;
  };
}

export interface UIButtonPressEvent extends GameEvent {
  type: 'UI_BUTTON_PRESS';
  payload: {
    id: string;
    position?: Vector2D;
  };
}

export interface UIButtonHoverStartEvent extends GameEvent {
  type: 'UI_BUTTON_HOVER_START';
  payload: {
    id: string;
  };
}

export interface UIButtonHoverEndEvent extends GameEvent {
  type: 'UI_BUTTON_HOVER_END';
  payload: {
    id: string;
  };
}

export interface UIComponentVisibilityEvent extends GameEvent {
  type: 'UI_COMPONENT_VISIBILITY';
  payload: {
    id: string;
    visible: boolean;
  };
}

export interface UIComponentEnableEvent extends GameEvent {
  type: 'UI_COMPONENT_ENABLE';
  payload: {
    id: string;
    enabled: boolean;
  };
}

export interface UIHealthChangeEvent extends GameEvent {
  type: 'HEALTH_CHANGE';
  payload: {
    currentHealth: number;
    maxHealth: number;
    percentage: number;
  };
}

export interface UILayerChangeEvent extends GameEvent {
  type: 'UI_LAYER_CHANGE';
  payload: {
    componentId: string;
    fromLayer: number;
    toLayer: number;
  };
}

export interface UIComponentAddedEvent extends GameEvent {
  type: 'UI_COMPONENT_ADDED';
  payload: {
    id: string;
    layer: number;
    type: string;
  };
}

export interface UIComponentRemovedEvent extends GameEvent {
  type: 'UI_COMPONENT_REMOVED';
  payload: {
    id: string;
  };
}

export interface UIStyleUpdateEvent extends GameEvent {
  type: 'UI_STYLE_UPDATE';
  payload: {
    id: string;
    style: Record<string, any>;
  };
}

export interface UIPositionUpdateEvent extends GameEvent {
  type: 'UI_POSITION_UPDATE';
  payload: {
    id: string;
    position: Vector2D;
  };
}

export interface UISizeUpdateEvent extends GameEvent {
  type: 'UI_SIZE_UPDATE';
  payload: {
    id: string;
    size: Vector2D;
  };
}

export interface UIInteractionEvent extends GameEvent {
  type: 'UI_INTERACTION';
  payload: {
    id: string;
    type: 'click' | 'press' | 'hover' | 'drag';
    position: Vector2D;
    data?: any;
  };
}

export type UIEvent =
  | UIButtonClickEvent
  | UIButtonPressEvent
  | UIButtonHoverStartEvent
  | UIButtonHoverEndEvent
  | UIComponentVisibilityEvent
  | UIComponentEnableEvent
  | UIHealthChangeEvent
  | UILayerChangeEvent
  | UIComponentAddedEvent
  | UIComponentRemovedEvent
  | UIStyleUpdateEvent
  | UIPositionUpdateEvent
  | UISizeUpdateEvent
  | UIInteractionEvent;
