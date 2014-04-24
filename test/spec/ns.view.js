describe('ns.View', function() {

    describe('ns.View.define', function() {

        beforeEach(function() {
            sinon.spy(ns.View, 'define');

            this.view = ns.View.define('test-view-define');
        });

        afterEach(function() {
            ns.View.define.restore();
        });

        it('should throw exception if I define View twice', function() {
            try {
                ns.View.define('test-view-define');
            } catch(e) {}

            expect(ns.View.define.getCall(1).threw()).to.be.equal(true);
        });

        it('should return new view', function() {
            expect(this.view).to.be.a('function');
        });

        it('instance of new view should be ns.View', function() {
            var instance = ns.View.create('test-view-define', {});
            expect(instance instanceof ns.View).to.be.equal(true);
        });
    });

    describe('ns.View getModel/getModelData', function() {

        beforeEach(function() {
            ns.View.define('test-getModel', {
                models: ['test-getModel']
            });

            ns.Model.define('test-getModel', {
                params: {
                    p: null
                }
            });

            this.params = {p: 1};
            this.modelData = 'modeldata' + Math.random();

            this.model = ns.Model.get('test-getModel', this.params);
            this.model.setData(this.modelData);

            this.view = ns.View.create('test-getModel', this.params);
        });

        afterEach(function() {
            delete this.model;
            delete this.modelData;
            delete this.params;
            delete this.view;
        });

        it("getModel should returns view's model", function() {
            expect(this.view.getModel('test-getModel')).to.be.equal(this.model);
        });

        it("getModelData should returns view's model data", function() {
            expect(this.view.getModelData('test-getModel')).to.be.equal(this.modelData);
        });

    });

    describe('Наследование от другого view', function() {

        beforeEach(function() {

            var parentMegaView = ns.View.define('parentMegaView', {
                methods: {
                    superMethod: function() {}
                }
            });

            // inherits by class reference
            ns.View.define('childMegaViewByFunction', {
                methods: {
                    oneMore: function() {}
                }
            }, parentMegaView);

            // inherits by view name
            ns.View.define('childMegaViewByName', {
                methods: {
                    oneMore: function() {}
                }
            }, 'parentMegaView');
        });

        afterEach(function() {
            delete this.view;
        });

        var tests = {
            'childMegaViewByFunction': 'inherits by class reference',
            'childMegaViewByName': 'inherits by view name'
        };

        for (var viewName in tests) {
            (function(viewName, suiteName) {

                describe(suiteName, function() {

                    beforeEach(function() {
                        this.view = ns.View.create(viewName, {});
                    });

                    it('наследуемый view должен быть ns.View', function() {
                        expect(this.view instanceof ns.View).to.be.equal(true);
                    });

                    it('методы наследуются от базового view', function() {
                        expect(this.view.superMethod).to.be.a('function');
                    });

                    it('методы от базового view не ушли в ns.View', function() {
                        expect(ns.View.prototype.superMethod).to.be.an('undefined');
                    });

                    it('методы ns.View на месте', function() {
                        expect(this.view.isOk).to.be.a('function');
                    });

                    it('методы из info.methods тоже не потерялись', function() {
                        expect(this.view.oneMore).to.be.a('function');
                    });

                });

            })(viewName, tests[viewName]);
        }
    });

    describe('ns.View.info models parse', function() {

        describe('no models specified', function() {

            beforeEach(function() {
                ns.Model.define('a');
                ns.Model.define('b');
                ns.Model.define('c');
            });

            afterEach(function() {
                ns.Model.undefine();
            });

            it('no models at all', function() {
                ns.View.define('test-view-info-models-parse_no-models', {});

                var info = ns.View.info('test-view-info-models-parse_no-models');
                expect(info.models).to.be.eql({});

                ns.View.undefine('test-view-info-models-parse_no-models');
            });

            it('models specified as empty array', function() {
                ns.View.define('test-view-info-models-parse_empty-array', { models: [] });

                var info = ns.View.info('test-view-info-models-parse_empty-array');
                expect(info.models).to.be.eql({});

                ns.View.undefine('test-view-info-models-parse_empty-array');
            });

            it('models array is converted to object', function() {
                ns.View.define('test-view-info-models-parse_array', { models: [ 'a', 'b' ] });

                var info = ns.View.info('test-view-info-models-parse_array');
                expect(info.models).to.be.eql({ a: true, b: true });

                ns.View.undefine('test-view-info-models-parse_array');
            });
        });
    });

    describe('ns.View render', function() {

        describe('ns.View render with some invalid models', function() {

            beforeEach(function() {
                ns.Model.define('a');
                ns.Model.define('b');
                ns.Model.define('c');

                ns.View.define('test-view-render_complex', {
                    models: {
                        a: true,
                        b: false,
                        c: null
                    }
                });
            });

            afterEach(function() {
                ns.Model.undefine();
                ns.View.undefine();
            });

            it('required models are valid, optional ones — invalid', function() {
                var a = ns.Model.get('a', { id: 1 });
                var b = ns.Model.get('b', { id: 2 });
                var c = ns.Model.get('c', { id: 3 });

                a.setData({ data: 'a' });
                b.setError({ error: 'b invalid' });
                c.setError({ error: 'c invalid' });

                var view = ns.View.create('test-view-render_complex', {}, false);

                expect( view.isModelsValid() ).to.be.equal(true);
            });

            it('required model is invalid, the rest is valid', function() {
                var a = ns.Model.get('a', { id: 1 });
                var b = ns.Model.get('b', { id: 2 });
                var c = ns.Model.get('c', { id: 3 });

                a.setError({ error: 'a invalid' });
                b.setData({ data: 'b' });
                c.setData({ data: 'c' });

                var view = ns.View.create('test-view-render_complex', {}, false);
                expect( view.isModelsValid() ).not.to.be.equal(true);
            });

            it('render errors also', function() {
                var a = ns.Model.get('a', { id: 1 });
                var b = ns.Model.get('b', { id: 2 });
                var c = ns.Model.get('c', { id: 3 });

                a.setData({ data: 'a' });
                b.setError({ error: 'b invalid' });
                c.setError({ error: 'c invalid' });

                var view = ns.View.create('test-view-render_complex', {}, false);

                expect( view._getModelsData() ).to.be.eql({
                    a: { data: 'a' },
                    b: { error: 'b invalid' },
                    c: { error: 'c invalid' }
                });
            });

        });
    });

    describe('ns-view-init event', function() {

        it('should call event handler defined as string', function() {
            var spy = sinon.spy();
            ns.View.define('myblock', {
                events: {
                    'ns-view-init': 'initCallback'
                },
                methods: {
                    initCallback: spy
                }
            });
            ns.View.create('myblock');

            expect(spy.calledOnce).to.be.equal(true);
        });

        it('should call event handler defined as string with ns.View instance', function() {
            var spy = sinon.spy();
            ns.View.define('myblock', {
                events: {
                    'ns-view-init': 'initCallback'
                },
                methods: {
                    initCallback: spy
                }
            });
            ns.View.create('myblock');

            expect(spy.getCall(0).thisValue instanceof ns.View).to.be.equal(true);
        });

        it('should bind event defined as function', function() {
            var spy = sinon.spy();
            ns.View.define('myblock', {
                events: {
                    'ns-view-init': spy
                }
            });
            ns.View.create('myblock');

            expect(spy.calledOnce).to.be.equal(true);
        });

        it('should bind event defined as function with ns.View instance', function() {
            var spy = sinon.spy();
            ns.View.define('myblock', {
                events: {
                    'ns-view-init': spy
                }
            });
            ns.View.create('myblock');

            expect(spy.getCall(0).thisValue instanceof ns.View).to.be.equal(true);
        });

    });

    describe('ns.View.info.params вычисление ключа view', function() {

        describe('Ключ строится по параметрам моделей: view.info.params == null', function() {

            beforeEach(function() {
                ns.Model.define('photo', { params: { login: null, id: null } });
                ns.Model.define('photo-tags', { params: { id: null, one_more: null, per_page: 10 } });
                ns.View.define('photo', {
                    models: [ 'photo', 'photo-tags' ]
                });
                ns.View.info('photo'); // это чтобы view полностью внутри проинициализировалось
            });

            it('Ключ view строится по параметрам моделей', function() {
                var params = { login: 'a', id: 4, one_more: 'xx', per_page: 10 };
                expect( ns.View.getKey('photo', params) ).to.be.eql('view=photo&login=a&id=4&one_more=xx&per_page=10');
            });

            it('Умолчательное значение параметра модели должно добавляться к ключу view', function() {
                // Потому что это ключ для модели, а следовательно, для данных и для того, что отображается во view.
                var params = { login: 'a', id: 4, one_more: 'xx' };
                expect( ns.View.getKey('photo', params) ).to.be.eql('view=photo&login=a&id=4&one_more=xx&per_page=10');
            });
        });

        describe('typeof view.info.params == "object"', function() {
            beforeEach(function() {
                ns.View.define('photo:v2', {
                    params: { login: null, id: null }
                });
                ns.View.define('photo:v3', {
                    params: { login: 'nop', id: null }
                });

                ns.View.info('photo:v2');
                ns.View.info('photo:v3');
            });

            it('Все параметры есть: ключ строится', function() {
                expect(ns.View.getKey('photo:v2', { login: 'test', id: 2 })).to.be.eql('view=photo:v2&login=test&id=2');
            });

            it('Ключ не должен строиться, если параметров не хватает', function() {
                expect(function() { ns.View.getKey('photo:v2', { login: 'test' }); }).to.throw();
            });

            it('В view.info.params задано значение для параметра (фильтр) и в params -- такое же значение', function() {
                expect(ns.View.getKey('photo:v3', { login: 'nop', id: 3 })).to.be.eql('view=photo:v3&login=nop&id=3');
            });

            it('В view.info.params задано одно значение для параметра, а в params пришло другое', function() {
                expect(function() { ns.View.getKey('photo:v3', { login: 'lynn', id: 3 }); }).to.throw();
            });

            it('В view.info.params задано значение для параметра, а в params значение отсутствует', function() {
                expect(function() { ns.View.getKey('photo:v3', { id: 3 }); }).to.throw();
            });
        });

        describe('typeof view.info.params == "array"', function() {
            beforeEach(function() {
                ns.View.define('slider', {
                    params: [
                        { 'context': 'contest', 'id': null },
                        { 'context': null },
                        { 'tag': null, 'login': null },
                        { 'login': null, 'album': null }
                    ]
                });
            });

            it('Ключ по 1-ому варианту с фильтром по одному из параметров', function() {
                expect(ns.View.getKey('slider', { login: 'nop', album: 6, context: 'contest', id: 3 })).to.be.eql('view=slider&context=contest&id=3');
            });

            it('Ключ по 2-ому варианту (для первого варианта не хватает параметров)', function() {
                expect(ns.View.getKey('slider', { login: 'nop', album: 6, context: 'contest' })).to.be.eql('view=slider&context=contest');
            });

            it('Ключ по 3-ому варианту', function() {
                expect(ns.View.getKey('slider', { login: 'nop', album: 6, context_new: 'tag', id: 8, tag: 'girls' })).to.be.eql('view=slider&tag=girls&login=nop');
            });

            it('Ключ по 4-ому варианту', function() {
                expect(ns.View.getKey('slider', { login: 'nop', album: 6, context_new: 'tag', id: 8, tag_new: 'girls' })).to.be.eql('view=slider&login=nop&album=6');
            });

            it('Ни один из вариантов не подходит', function() {
                expect(function() { ns.View.getKey('slider', { album: 6, context_new: 'tag', id: 8, tag_new: 'girls' }); }).to.throw();
            });
        });

        describe('typeof view.info.params == "function"', function() {
            beforeEach(function() {
                ns.View.define('slider', {
                    params: function(params) {
                        if (params.mode === 'custom') {
                            return { id: params['id'] };
                        }
                        return {};
                    }
                });
            });

            it('view=slider&id=1', function() {
                expect(ns.View.getKey('slider', { mode: 'custom', id: 1 })).to.be.eql('view=slider&id=1');
            });

            it('view=slider&id=', function() {
                expect(ns.View.getKey('slider', { mode: 'custom', id: '' })).to.be.eql('view=slider&id=');
            });

            it('view=slider', function() {
                expect(ns.View.getKey('slider', { mode: 'new' })).to.be.eql('view=slider');
            });
        });

        describe('ns.View: params+ / params-', function() {
            beforeEach(function() {
                ns.View.define('slider', {
                    params: [
                        { 'context': 'contest', 'id': null },
                        { 'context': null }
                    ],
                    'params-': []
                });
            });

            it('Нельзя указывать одновременно params и params+/-', function() {
                expect(function() { ns.View.info('slider'); }).to.throw();
            });
        });

        describe('ns.View: params+', function() {
            beforeEach(function() {
                ns.Model.define('photo', { params: { login: null, id: null } });
                ns.Model.define('photo-tags', { params: { id: null, one_more: null, per_page: 10 } });
                ns.View.define('photo', {
                    models: [ 'photo', 'photo-tags' ],
                    'params+': {
                        'add_me': 666
                    }
                });
                ns.View.info('photo'); // это чтобы view полностью внутри проинициализировалось
            });

            it('params+ добавляются к ключу', function() {
                var params = { login: 'a', id: 4, one_more: 'xx', per_page: 10 };
                expect( ns.View.getKey('photo', params) ).to.be.eql('view=photo&login=a&id=4&one_more=xx&per_page=10&add_me=666');
            });
        });

        describe('ns.View: params-', function() {
            beforeEach(function() {
                ns.Model.define('photo', { params: { login: null, id: null } });
                ns.Model.define('photo-tags', { params: { id: null, one_more: null, per_page: 10 } });
                ns.View.define('photo', {
                    models: [ 'photo', 'photo-tags' ],
                    'params-': [ 'one_more' ]
                });
                ns.View.info('photo'); // это чтобы view полностью внутри проинициализировалось
            });

            it('params- исключаются из ключа', function() {
                var params = { login: 'a', id: 4, one_more: 'xx', per_page: 10 };
                expect( ns.View.getKey('photo', params) ).to.be.eql('view=photo&login=a&id=4&per_page=10');
            });
        });

        describe('Когда ключ view строится по части параметров - this.params у view должны хранить исходный набор (а не тот, что используется в ключе)', function() {

            beforeEach(function() {
                ns.View.define('photo', { params: { login: null, id: null } });
            });

            it('preserve full params object', function() {
                var params = { login: 'a', id: 4, one_more: 'xx', per_page: 10 };
                var view = ns.View.create('photo', params);
                expect(view.params).to.eql(params);
            });

        });

    });

    describe('updateHTML', function() {

        describe('redraw async view with child depens on same model', function() {

            beforeEach(function(done) {
                var that = this;

                ns.layout.define('app', {
                    'app': {
                        'async-view&': {
                            'async-view-child': true
                        }
                    }
                });

                ns.View.define('app');
                ns.View.define('async-view', {models: ['async-view-model'] });
                ns.View.define('async-view-child', {models: ['async-view-model'] });

                ns.Model.define('async-view-model');

                // set first data to model
                var model = ns.Model.get('async-view-model', {}).setData({data: true});

                var APP = ns.View.create('app');

                this.sinon.server.autoRespond = true;
                this.sinon.server.respond(function(xhr) {
                    xhr.respond(
                        200,
                        {"Content-Type": "application/json"},
                        JSON.stringify({
                            models: [
                                { data: true }
                            ]
                        })
                    );
                });

                var layout = ns.layout.page('app', {});
                new ns.Update(APP, layout, {})
                    .start()
                    .done(function() {
                        model.invalidate();
                        that.asyncViewNode1 = APP.$node.find('.ns-view-async-view')[0];

                        new ns.Update(APP, layout, {})
                            .start()
                            .done(function(asyncPromises) {
                                no.Promise.wait(asyncPromises.async)
                                    .done(function() {
                                        that.asyncViewNode2 = APP.$node.find('.ns-view-async-view')[0];
                                        done();
                                    })
                                    .fail(function() {
                                        done('fail to init');
                                    });
                            });
                    });
            });

            afterEach(function() {
                delete this.asyncViewNode1;
                delete this.asyncViewNode2;
            });

            it('"async-view" should have different nodes after redraw', function() {
                expect(this.asyncViewNode2).not.to.be.equal(this.asyncViewNode1);
            });

            it('"async-view" should have child view', function() {
                expect($(this.asyncViewNode2).find('.ns-view-async-view-child')).to.have.length(1);
            });

        });

        describe('redraw old view when model was invalidated', function() {

            // https://github.com/yandex-ui/noscript/pull/192#issuecomment-33148362
            // После починки _unbindModels перестало работать обновление view при изменении модели.
            // Дело тут в том, что view подписана на своим модели. Модель поменялась - view перерисовалась (model ns-model-changed -> view invalidate).
            // Когда мы починили отписку view от модели (во время _hide) изменения модели больше не будут услышаны view (что, как бы, хорошо и by design).
            // Но тогда, во время update-а надо проверять, что все модели view валидны. И если нет - обновлять view.
            // Итог: не отписываем view от моделей

            var goToPage = function(app, params, callback) {
                var layout = ns.layout.page('app', params);
                return new ns.Update(app, layout, params).start().done(function() { callback(); });
            };

            beforeEach(function() {
                this.spies = {};

                ns.View.define('app');
                ns.View.define('view', { models: [ 'model' ] });

                // Модель и сразу два экземляра создаём заранее
                ns.Model.define('model', { params: { id: null } });
                this.model1 = ns.Model.get('model', { id: 1 }).setData({ data: 1 });
                this.model2 = ns.Model.get('model', { id: 2 }).setData({ data: 2 });

                ns.layout.define('app', {
                    'app': {
                        'box@': 'view'
                    }
                });

                this.appView = ns.View.create('app');
            });

            afterEach(function() {
                for (var spyName in this.spies) {
                    this.spies[spyName].restore();
                }
            });

            it('redraw view after model invalidate while view was hidden', function(done) {
                var spies = this.spies;
                var model1 = this.model1;
                var app = this.appView;
                var view1;

                // Показываем страницы: 1 - 2 - 1
                goToPage(app, { id: 1 }, function() {
                    view1 = app.views.box.views['view=view&id=1'];

                    spies.view1Invalidate = sinon.spy(view1, 'invalidate');
                    spies.view1SetNode = sinon.spy(view1, '_setNode');
                    spies.view1Hide = sinon.spy(view1, '_hide');

                    goToPage(app, { id: 2 }, function() {
                        // view1 не видно.
                        expect(view1._visible).to.be.eql(false);
                        expect(spies.view1Hide.callCount).to.be.eql(1);
                        expect(spies.view1SetNode.callCount).to.be.eql(0);

                        // Меняется model1
                        model1.setData({ id: 1, changed: true });
                        expect(spies.view1Invalidate.callCount).to.be.eql(1); // NOTE да да да, view даже спрятанная слышит изменения моделей.

                        // Идёт назад - view должно перерисоваться
                        goToPage(app, { id: 1 }, function() {
                            expect(spies.view1SetNode.callCount).to.be.eql(1);
                            done();
                        });
                    });
                });
            });

            it('do not bind twice to model changed after show - hide - show cicle', function(done) {
                var spies = this.spies;
                var model1 = this.model1;
                var app = this.appView;
                var view1;

                // Показываем страницы: 1 - 2 - 1 - 2
                // view1 показывалось 2 раза.
                // Надо проверить, что не будет двойного invalidate на ns-model-changed
                goToPage(app, { id: 1 }, function() {
                    view1 = app.views.box.views['view=view&id=1'];

                    spies.view1Invalidate = sinon.spy(view1, 'invalidate');

                    goToPage(app, { id: 2 }, function() {
                        goToPage(app, { id: 1 }, function() {
                            goToPage(app, { id: 2 }, function() {
                                model1.setData({ id: 1, changed: true });
                                expect(spies.view1Invalidate.callCount).to.be.eql(1);
                                done();
                            });
                        });
                    });
                });
            });
        });

    });

    describe('ns.View update after model destruction', function() {
        beforeEach(function(finish) {

            ns.Model.define('mSimple');

            // set data to collection
            ns.Model.get('mSimple').setData({foo: 'bar'});

            // define views
            ns.View.define('app');

            ns.View.define('vSimple', {
                models: [ 'mSimple' ]
            });

            // define layout
            ns.layout.define('app', {
                'app': {
                    'vSimple': {}
                }
            });

            // initiate first rendering
            this.APP = ns.View.create('app');
            var layout = ns.layout.page('app', {});
            new ns.Update(this.APP, layout, {})
                .start()
                .done(function() {
                    ns.Model.destroy(ns.Model.get('mSimple'));

                    ns.Model.get('mSimple').setData({foo: 'bar2'});

                    new ns.Update(this.APP, layout, {})
                        .start()
                        .done(function() {
                            finish();
                        }.bind(this));
                }.bind(this));
        });

        afterEach(function() {
            delete this.APP;
        });

        it('should have 1 node for view vSimple', function() {
            expect(this.APP.node.querySelectorAll('.ns-view-vSimple').length).to.be.equal(1);
        });

    });
});
