// 단순 오브젝트 풀.
// factory()로 객체 생성, reset(obj, ...args)으로 초기화.
// active 플래그로 사용 중인지 표시.

export class Pool {
  constructor(factory, size) {
    this.factory = factory;
    this.items = [];
    for (let i = 0; i < size; i++) {
      const it = factory();
      it.active = false;
      this.items.push(it);
    }
  }

  spawn() {
    // 비활성 객체를 찾아 반환. 없으면 null (풀 부족).
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].active) {
        this.items[i].active = true;
        return this.items[i];
      }
    }
    return null;
  }

  forEach(cb) {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) cb(this.items[i], i);
    }
  }

  countActive() {
    let n = 0;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].active) n++;
    }
    return n;
  }

  clear() {
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].active = false;
    }
  }
}
