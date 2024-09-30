class GlobalStorage<T> {
    private storageKey: string;
  
    constructor(storageKey: string) {
      this.storageKey = storageKey;
    }
  
    getItem(): T | null {
      const item = localStorage.getItem(this.storageKey);
      return item ? JSON.parse(item) : null;
    }
  
    setItem(value: T): void {
      localStorage.setItem(this.storageKey, JSON.stringify(value));
    }
  
    removeItem(): void {
      localStorage.removeItem(this.storageKey);
    }
  
    static clearAll(): void {
      localStorage.clear();
    }
  }
  
  interface GlobalSettings {
    name: string;
    url: string;
  }

  const settings = new GlobalStorage<GlobalSettings>('appSettings');

  export default settings;