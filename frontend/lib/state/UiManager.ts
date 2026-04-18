import { makeAutoObservable } from "mobx";

export class UiManager {
  constructor() {
    makeAutoObservable(this);
  }
}
