import { makeAutoObservable } from "mobx";
import { UiManager } from "./UiManager";
import { DesignManager } from "./DesignManager";

export class StateManager {
  private _uiManager: UiManager;
  private _designManager: DesignManager;

  constructor() {
    makeAutoObservable(this);
    this._uiManager = new UiManager();
    this._designManager = new DesignManager();
  }

  get ui(): UiManager {
    return this._uiManager;
  }

  get design(): DesignManager {
    return this._designManager;
  }
}

export const stateManager = new StateManager();
