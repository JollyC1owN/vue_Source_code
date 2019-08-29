// el--new Vue中的容器    vm--vm实例对象
function Compile (el, vm) { // el = "#app"
    // 将vm实例对象保存到，Compile实例对象的 $vm 的属性上
    this.$vm = vm;
    // 对容器进行判断，判断是否是一个标签节点   不是的话则通过传入的选择器，进行获取该标签节点  保存到$el中
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    // 如果$el存在的话，进判断
    if (this.$el) {
        // 调用node2Fragment（）创建文档碎片对象
        // $fragment  ---是一个文档碎片对象
        this.$fragment = this.node2Fragment(this.$el);
        // 进行初始化操作，里面东西贼多---慢慢分析
        this.init();
        // 把文档碎片中的内容放到el的容器中，完成页面的显示
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    constructor: Compile,
    // 创建一个文档碎片对象函数
    node2Fragment: function (el) {
        // 创建一个文档碎片容器
        // 还创建了一个child的变量
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生节点拷贝到fragment容器对象中 ----实际上做的剪切的一个操作
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        // 最后把拷贝好的文档碎片返回
        return fragment;
    },
    // 初始化的代码执行
    init: function () {
        // 在初始化的操作时，调用下面的函数，并且把文档碎片对象作为实参传入
        this.compileElement(this.$fragment);
    },
    // 真正的初始化代码的执行    el----文档碎片对象
    compileElement: function (el) {
        // 把文档碎片中的所有子节点（元素节点，文本节点）拿出来保存起来
        // 还做的了缓存this == Compile实例对象 
        var childNodes = el.childNodes,
            me = this;
        // 把保存了所有子节点的伪数组变成真数组
        // 进行遍历操作
        [].slice.call(childNodes).forEach(function (node) {
            // 遍历所有的子节点，拿到子节点中的文本内容
            var text = node.textContent;
            // 匹配表达式的正则
            // () 成为一组，从最边开始数起，碰到(为一组，并计数，下面只有一个，所以是第一组，即 $1
            // . -->任意字符， *任意次数  
            var reg = /\{\{(.*)\}\}/;
            // 判断当前的节点是否是一个元素节点
            if (me.isElementNode(node)) {
                me.compile(node);
                // 判断是不是一个文本节点，并且通过正则的匹配，即：是一个表达式
            } else if (me.isTextNode(node) && reg.test(text)) {
                // 进判断后执行下面的函数
                // node：是当前的子节点
                // RegExp.$1.trim()--->是拿到{{msg}}，双大括号中的msg
                me.compileText(node, RegExp.$1.trim());
            }
            // 判断这个节点是否还有子节点，并且子节点不为空 例子中的节点；<p>{{msg}}</p>
            if (node.childNodes && node.childNodes.length) {
                // 如果有子节点，则就进行该函数的递归操作
                me.compileElement(node);
            }
        });
    },
    // 如果上面的判断是一个元素节点，则把这个元素节点传入执行下面的函数
    compile: function (node) {
        // 把这个元素节点中的所有标签属性 element.attributes --->这个来获取标签中的所有属性，并返回一个伪数组
        // 还做了缓存this === compile实例对象
        var nodeAttrs = node.attributes,
            me = this;
        // 将伪数组转换成真数组，然后进行遍历，操作其中的每一项
        [].slice.call(nodeAttrs).forEach(function (attr) {   // v-on:click
            // 获取到当前属性对应的属性名
            var attrName = attr.name; // v-on:click
            // 对属性名进行判断
            if (me.isDirective(attrName)) {
                // 拿到该属性所对应的value值   v-on:click = "showName"
                var exp = attr.value;    // showName
                // 对属性名进行裁剪，把v-  后面的内容裁出来
                var dir = attrName.substring(2); // on:click
                // 事件指令:判断当前的dir 是不是事件指令  ---> on：开头的
                if (me.isEventDirective(dir)) {
                    // 是一个事件则去compileUtil对象中找到eventHandler方法，进行调用
                    // node子元素节点button 
                    // me.$vm：vm实例对象
                    // exp：showName---事件所对应的那个方法名。或者回调
                    // dir：on:click
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                    // 普通指令
                } else {
                    // 指令不是on:开头的则为一般指令
                    // v-text 。v-html   这两个执行的跟表达式的操作是类似的，都是找到对应的值，方法标签中
                    // dir:text /html    class
                    // node:p标签
                    // me.$vm：vm实例对象
                    // exp：content   cls
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
                // 在为标签做完属性的处理后,删除标签中的属性名及属性值
                node.removeAttribute(attrName);
            }
        });
    },
    // node当前的节点：；<p></p> p 标签  exp："msg"
    compileText: function (node, exp) {
        // this.$vm：vm的实例对象---之前保存的
        // 执行文本指令的函数操作
        compileUtil.text(node, this.$vm, exp);
    },
    // 判断当前传入的属性名
    isDirective: function (attr) {
        // 若是v-开头的属性名，则返回true
        return attr.indexOf('v-') == 0;
    },
    // 判断是否是一个事件
    isEventDirective: function (dir) {
        // 以on开头的则为true
        return dir.indexOf('on') === 0;
    },
    // 判断传入的el是否是一个元素节点
    isElementNode: function (node) {
        // 根据节点的nodeType的值来判断
        /* 
        元素节点：1
        document（根节点）：9
        注释节点：8
        文本节点：3
        属性节点：2
         */
        return node.nodeType == 1;
    },
    // 判断传入的是否是一个文本节点
    isTextNode: function (node) {
        // 根据节点的nodeType的值来判断
        return node.nodeType == 3;
    }
};

// 所有指令处理集合
var compileUtil = {
    // 表达式的处理/v-text的处理
    text: function (node, vm, exp) {
        // node：p标签，vm:vm实例对象，exp: 'msg'
        this.bind(node, vm, exp, 'text');
    },
    // v-html
    html: function (node, vm, exp) {
        // node：p标签，vm:vm实例对象，exp: 'content'
        this.bind(node, vm, exp, 'html');
    },
    // 双向数据绑定
    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },
    // v-class  node：p标签，vm:vm实例对象，exp: 'cls'
    class: function (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },
    // node：p标签，vm:vm实例对象，exp: 'cls'   dir:class
    bind: function (node, vm, exp, dir) { // dir：'text'
        // 得到的是一个函数   去updater这个大对象中去找：dir + 'Updater'== textUpdater 找的textUpdater这个函数
        var updaterFn = updater[dir + 'Updater'];
        // 判断这个函数是否存在，并且调用这个函数
        // 参数：node：p标签      this._getVMVal(vm, exp)：他的返回结果作为参数：返回结果是找到vm实例对象中msg的值
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    // node子元素节点button 
    // vm：vm实例对象
    // exp：showName---事件所对应的那个方法名。或者回调
    // dir：on:click
    eventHandler: function (node, vm, exp, dir) {
        // 取on:click 中的click部分   为真正的事件名
        var eventType = dir.split(':')[1],
            // 在vm实例对象中配置对象中有methods属性，并且在该属性中找到我们exp：showName所对应的回调函数
            fn = vm.$options.methods && vm.$options.methods[exp];
        // 事件名和回调都存在的情况
        if (eventType && fn) {
            // 为该标签通过addEventListener绑定事件监听
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    // 通过vm实例对象，和exp：msg，即data中的属性名，去vm的实例对象中找到这个属性所对应的值
    _getVMVal: function (vm, exp) {
        // 保存vm实例对象
        var val = vm;
        // 当有：user.name的表达式时会通过 . 分成两个部分，成为一个数组
        // 当没有时，例如：'msg' 则会把msg放到数组中 ===> ["msg"]
        exp = exp.split('.');
        // 通过遍历数组中的属性，去找到对应的属性值
        exp.forEach(function (k) {
            // 即：vm[msg] ---get操作，则会进入到MVVM.js中的get方法中
            val = val[k];
        });
        // 把找的值返回
        return val;
    },

    _setVMVal: function (vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};


var updater = {
    // 文本操作的函数  node：p标签   value：是msg所对应的属性值
    textUpdater: function (node, value) {
        // 有则会把p标签中的{ { msg}}替换成msg的属性值
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    // v-html
    htmlUpdater: function (node, value) {
        // innerHTML：编译html
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    // v-class  node：p标签   value：cls对应的类名 classA   oldValue--undefined
    classUpdater: function (node, value, oldValue) {
        // 拿到标签原有的class类名   <p v-class="cls"  class="classB"></p>
        var className = node.className;  // className= ""
        // oldValue = undefined                        以空格作为结束
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';
        // 执行上边一句：space =""  className=""  vlaue="classA"

        node.className = className + space + value;
        // <p class="classA"></p>
    },

    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
