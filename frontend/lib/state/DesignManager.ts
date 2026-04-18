import { makeAutoObservable } from "mobx";

export class DesignManager {
  constructor() {
    makeAutoObservable(this);
  }
}
