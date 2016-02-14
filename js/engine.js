//Анонімна функція(jquery alias - для уникнення конфліктів змінних)
(function ($) {

    window.App = {
        Models: {},
        Views: {},
        Collections: {},
        Routers: {}
    };  


    //Масив для колекції
    var car_item = [
        { car_img: "img/placeholder1.png", brands: "Pontiac", models: "GTO", release_year: "1967", engine_large: "330", horsepower: "360"},
        { car_img: "img/placeholder.png", brands: "Ford", models: "Mustang Boss 429", release_year: "1969", engine_large: "429", horsepower: "375"},
        { car_img: "img/placeholder.png", brands: "Chevrolet ", models: "Camaro ZL1", release_year: "1969", engine_large: "427", horsepower: "430"},
        { car_img: "img/placeholder.png", brands: "Plymouth", models: "Hemi 'Cuda", release_year: "1970", engine_large: "426", horsepower: "425"},
        { car_img: "img/placeholder.png", brands: "Chevrolet", models: "Chevelle SS 454", release_year: "1969", engine_large: "454", horsepower: "360"},
        { car_img: "img/placeholder.png", brands: "Chevrolet", models: "Chevelle SS", release_year: "1970", engine_large: "454", horsepower: "500"},
        { car_img: "img/placeholder.png", brands: "Dodge", models: "Charger R/T", release_year: "1968", engine_large: "318", horsepower: "385"},
        { car_img: "img/placeholder.png", brands: "Buick", models: "GSX", release_year: "1970", engine_large: "455", horsepower: "360"}
    ];

    //Модель
    App.Models.Car = Backbone.Model.extend({
        defaults: {
            car_img: "img/placeholder.png",
            brands: "",
            models: "",
            release_year: "",
            engine_large: "",
            horsepower: ""
        }
    });

    //Колекція
    App.Collections.Car = Backbone.Collection.extend({
        model: App.Models.Car
    });

    //Представлення
    App.Views.Car = Backbone.View.extend({

        tagName: "div",
        className: "car-container",

        template: _.template($("#carTemplate").html()),        // основний шаблон
        editTemplate: _.template($("#carEditTemplate").html()), // шаблон заповнення колекції

        render: function () {
            this.$el.html(this.template(this.model.toJSON())); //рендер вмісту сторінки
            return this;
        },

        events: {
            "click button.delete": "deleteItem", // видалення елементу
            "click button.edit": "editItem",     // редагування елемента
            "change select.type": "addType",     // змінна селекту
            "click button.save": "saveEdits",    // збереження 
            "click button.cancel": "cancelEdit"  // відміна
        },

        deleteItem: function () {
            var removedType = this.model.get("brands").toLowerCase();
            //Видалити модель
            this.model.destroy();
            //Видалити представлення
            this.remove();
        },

        editItem: function () {
            this.$el.html(this.editTemplate(this.model.toJSON()));
        },

        addType: function () {
            if (this.select.val() === "addType") {

                this.select.remove();

                $("<input />", {
                    "class": "type"
                }).insertAfter(this.$el.find(".name")).focus();
            }
        },

        //Збереження нового об'єкту в колекцію
        saveEdits: function (e) {
            e.preventDefault();

            var formData = {},
                prev = this.model.previousAttributes();

            $(e.target).closest("form").find(":input").not("button").each(function () {
                var el = $(this);
                formData[el.attr("class")] = el.val();
            });

            this.model.set(formData);
            this.render();

            _.each(car_item, function (car) {
                if (_.isEqual(car, prev)) {
                    car_item.splice(_.indexOf(car_item, car), 1, formData);
                }
            });
        },

        cancelEdit: function () {
            this.render();
        }
    });

    App.Views.CarsItem = Backbone.View.extend({
        el: $("#car-item"),

        initialize: function () {
            this.collection = new App.Collections.Car(car_item);

            this.render();
            this.$el.find("#filter").append(this.createSelect());

            this.on("change:filterType", this.filterByBrands, this);
            this.collection.on("reset", this.render, this);
            this.collection.on("add", this.renderItem, this);
            this.collection.on("remove", this.removeItem, this);
        },

        render: function () {
            this.$el.find("div").remove();

            _.each(this.collection.models, function (item) {
                this.renderItem(item);
            }, this);
        },

        renderItem: function (item) {
            var carView = new App.Views.Car({
                model: item
            });
            this.$el.append(carView.render().el);

        },

        //Метод повертає значння (brands)
        getTypes: function () {
            return _.uniq(this.collection.pluck("brands"), false, function (brands) { // метод pluck() повертає всі значення властивості brands
                return brands.toLowerCase();
            });
        },

        //Метод створює селект
        createSelect: function () {
            var filter = this.$el.find("#filter"),
                select = $("<select/>", {
                    html: "<option value='all'>All</option>"
                });

            _.each(this.getTypes(), function (item) {
                var option = $("<option/>", {
                    value: item.toLowerCase(),
                    text: item
                }).appendTo(select);
            });

            return select;
        },

        //Події
        events: {
            "change #filter select": "setFilter",
            "click #add": "addCar",
            "click #showForm": "showForm"
        },

        setFilter: function (e) {
            this.filterType = e.currentTarget.value; //записуємо вибране в селекті
            this.trigger("change:filterType");
        },

        //Фільтрація контенту
        filterByBrands: function () {
            if (this.filterType === "all") { //якщо "all" то виводимо всі елементи колекції
                this.collection.reset(car_item);
                carRouter.navigate("filter/all");
            } else {
                this.collection.reset(car_item, { silent: true });

                var filterType = this.filterType,
                    filtered = _.filter(this.collection.models, function (item) {
                        return item.get("brands").toLowerCase() === filterType;
                    });

                this.collection.reset(filtered);

                carRouter.navigate("filter/" + filterType);
            }
        },

        addCar: function (e) {
            e.preventDefault();

            var formData = {};
            $("#addCar").children("input").each(function (i, el) {
                if ($(el).val() !== "") {
                    formData[el.id] = $(el).val();
                }
            });

            car_item.push(formData);

            //Зносимо зміни в селект
            if (_.indexOf(this.getTypes(), formData.type) === -1) {
                this.collection.add(new App.Models.Car(formData));
                this.$el.find("#filter").find("select").remove().end().append(this.createSelect());
            } else {
                this.collection.add(new App.Models.Car(formData));
            }
            
            this.$el.find("#addCar").slideToggle();
        },

        removeItem: function (removedModel) {
            var removed = removedModel.attributes;

            if (removed.car_img === "img/placeholder.png") {
                delete removed.car_img;
            }

            _.each(car_item, function (car) {
                if (_.isEqual(car, removed)) {
                    car_item.splice(_.indexOf(car_item, car), 1);
                }
            });
        },

        showForm: function () {
            this.$el.find("#addCar").slideToggle(); // Розгортання вкладки
        }
    });

    //Навігація по роутах
    App.Routers.Car = Backbone.Router.extend({
        routes: {
            "filter/:type": "urlFilter"
        },

        urlFilter: function (type) {
            carsItem.filterType = type;
            carsItem.trigger("change:filterType");
        }
    });

    var carsItem = new App.Views.CarsItem();
    var carRouter = new App.Routers.Car();
    Backbone.history.start();

} (jQuery));