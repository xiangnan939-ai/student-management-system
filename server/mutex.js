class Mutex {
    constructor() {
        this._queue = [];
        this._locked = false;
    }

    // 请求锁
    acquire() {
        return new Promise(resolve => {
            if (!this._locked) {
                this._locked = true;
                resolve();
            } else {
                this._queue.push(resolve);
            }
        });
    }

    // 释放锁
    release() {
        if (this._queue.length > 0) {
            const nextResolve = this._queue.shift();
            // 让出执行权，模拟更真实的线程调度
            setImmediate(nextResolve);
        } else {
            this._locked = false;
        }
    }
}

module.exports = Mutex;
