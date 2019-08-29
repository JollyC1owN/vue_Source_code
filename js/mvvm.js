// options-->指的是new时传入的配置对象{el:"#App",data:{}}
function MVVM (options) {
    // 保存当前的vm实例对象的配置对象，到$options属性上
    // this = vm实例对象
    this.$options = options || {};
    // 将vm实例对象中的data数据对象保存到vm的_data中，再用变量data接收
    var data = this._data = this.$options.data;
    // 保存vm实例对象化
    var me = this;

    // 数据代理
    // 实现 vm.xxx -> vm._data.xxx
    // 把data数据对象中的所有属性名放到一个数组中并且遍历
    Object.keys(data).forEach(function (key) {
        // 遍历把属性名当做实参传入下面的函数中
        me._proxyData(key);
    });
    // 初始化计算属性
    this._initComputed();
    // 劫持 --------------------------------------------
    // data: vm实例对象中的data数据对象
    observe(data, this);
    // vm实例对象下的一个属性$compile存储了一个编译对象
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    constructor: MVVM,
    $watch: function (key, cb, options) {
        new Watcher(this, key, cb);
    },
    /* 实现数据代理的代码 */
    // 上面循环遍历，传入了data数据对象中的每个属性名 ---setter, getter并没有传入，则为undefined
    _proxyData: function (key, setter, getter) {
        // 缓存this===vm实例对象
        var me = this;
        setter = setter ||
            // 调用Object.defineProperty，给vm实例对象添加一个新的属性（data对象中的属性）
            Object.defineProperty(me, key, {
                configurable: false, // 是否允许重新定义
                enumerable: true, // 是否可以遍历
                // 当外界进行获取操作时，进get
                get: function proxyGetter () {
                    /* 在上面已经把data数据对象保存到vm实例对象的_data中了，
                    所以去这里面直接找新添加的这个属性的值并返回即可 */
                    return me._data[key];
                },
                // 监听数据的变化：外界对数据进行修该时，监听到数据的变化，就会进set
                set: function proxySetter (newVal) {
                    // set会监听到最新的数据，然后对修改的属性进行重新赋值的操作
                    me._data[key] = newVal;
                }
            });
    },

    _initComputed: function () {
        // 缓存this == vm实例对象
        var me = this;
        // 拿到配置对象中的computed对象
        var computed = this.$options.computed;
        if (typeof computed === 'object') { // 当是一个对象的时候进入判断
            // 拿到computed中的所有属性，下面操作与data中操作类似
            Object.keys(computed).forEach(function (key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get,
                    set: function () { }
                });
            });
        }
    }
};
