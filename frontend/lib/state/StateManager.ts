import { makeAutoObservable } from "mobx";
import { UiManager } from "./UiManager";
import { DesignManager } from "./DesignManager";
import { AuthManager } from "./AuthManager";

export class StateManager {
  private _uiManager: UiManager;
  private _designManager: DesignManager;
  private _authManager: AuthManager;

  constructor() {
    makeAutoObservable(this);
    this._uiManager = new UiManager();
    this._designManager = new DesignManager();
    this._authManager = new AuthManager();
  }

  get ui(): UiManager {
    return this._uiManager;
  }

  get design(): DesignManager {
    return this._designManager;
  }

  get auth(): AuthManager {
    return this._authManager;
  }
}

export const stateManager = new StateManager();
