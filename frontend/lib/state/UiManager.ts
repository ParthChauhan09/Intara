import { makeAutoObservable } from "mobx";

export class UiManager {
  isGlobalLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  setGlobalLoading(value: boolean) {
    this.isGlobalLoading = value;
  }
}
