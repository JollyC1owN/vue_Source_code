// data:{msg: "<a href="http://www.baidu.com">百度</a>"}
function Observer (data) {
    // 将vm实例对象中的data数据对象，保存到当前劫持实例对象的data属性中
    this.data = data;
    // 调用walk   参数：data:{msg: "<a href="http://www.baidu.com">百度</a>"}
    this.walk(data);
}

Observer.prototype = {
    constructor: Observer,
    // data:{msg: "<a href="http://www.baidu.com">百度</a>"}
    walk: function (data) {
        // 缓存当前劫持实例对象  this
        var me = this;
        // 拿到data中所有属性名   遍历所有属性名
        Object.keys(data).forEach(function (key) {
            // 执行下面的函数
            // key：属性名   data[key]：属性值
            me.convert(key, data[key]);
        });
    },
    // key：属性名   val：属性值
    convert: function (key, val) {
        // this.data：将vm实例对象中的data数据对象   key：属性名   val：属性值
        this.defineReactive(this.data, key, val);
    },
    // data：将vm实例对象中的data数据对象   key：属性名   val：属性值
    defineReactive: function (data, key, val) {
        // 创建一个dep对象
        // 有一个属性创建一个dep
        var dep = new Dep();
        // 没有用到childObj暂时不用管
        var childObj = observe(val);
        // 为data添加属性
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function () {
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知订阅者
                dep.notify();
            }
        });
    }
};
// 在MVVM中执行了这个函数。
// 传入 value:{msg: "<a href="http://www.baidu.com">百度</a>"}
// vm   vm实例对象
function observe (value, vm) {
    // value没有或者不是一个对象才会进判断return
    if (!value || typeof value !== 'object') {
        return;
    }
    // value:{msg: "<a href="http://www.baidu.com">百度</a>"}
    return new Observer(value);
};


var uid = 0;

function Dep () {
    // 每个dep中都有一个唯一的id    和一个subs数组
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: function (sub) {
        this.subs.push(sub);
    },

    depend: function () {
        Dep.target.addDep(this);
    },

    removeSub: function (sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function () {
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }
};

Dep.target = null;
