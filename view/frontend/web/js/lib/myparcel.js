/*
 * Constants
 */

(function() {
  
    var $, AO_DEFAULT_TEXT, Application, CARRIER, DAYS_OF_THE_WEEK, DAYS_OF_THE_WEEK_TRANSLATED, DEFAULT_DELIVERY, DISABLED, HVO_DEFAULT_TEXT, NATIONAL, NORMAL_PICKUP, PICKUP, PICKUP_TIMES, POST_NL_TRANSLATION, Slider, displayOtherTab, externalJQuery, obj1, orderOpeningHours, preparePickup, renderDeliveryOptions, renderPage, renderPickup, renderPickupLocation, showDefaultPickupLocation, sortLocationsOnDistance, updateDelivery, updateInputField, hideMyParcelOptions,

        bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    DISABLED = 'disabled';

    HVO_DEFAULT_TEXT = 'Handtekening voor ontvangst';

    AO_DEFAULT_TEXT = 'Alleen geadresseerde';

    NATIONAL = 'BE';

    CARRIER = 1;

    DEFAULT_DELIVERY = 'default';

    PICKUP = 'pickup';

    POST_NL_TRANSLATION = {
        standard: 'default'
    };

    DAYS_OF_THE_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    DAYS_OF_THE_WEEK_TRANSLATED = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

    NORMAL_PICKUP = '16:00:00';

    PICKUP_TIMES = (
        obj1 = {},
            obj1["" + NORMAL_PICKUP] = 'normal',
            obj1
    );

    this.MyParcel = Application = (function() {

        /*
         * Setup initial variables
         */
        function Application(options) {
            var base;
            if (window.mypa == null) {
                window.mypa = {
                    settings: {}
                };
            }
            if ((base = window.mypa.settings).base_url == null) {
                base.base_url = "//localhost:8080/api/delivery_options";
            }

            /** fix ipad */
            var isload = false;
            setTimeout(function () {
                if(isload != true){
                    hideMyParcelOptions();
                }
            }, 1000);

            this.el = document.getElementById('myparcel');
            isload = true;

            this.$el = externalJQuery('myparcel');

            this.render();
            this.expose(this.updatePage, 'updatePage');
            this.expose(this.optionsHaveBeenModified, 'optionsHaveBeenModified');
            this.expose(this.showDays, 'showDays');
            this.expose(this.hideDays, 'hideDays');
            this.expose(this, 'activeInstance');
        }


        /*
         * Reloads the HTML form the template.
         */

        Application.prototype.render = function() {

            return this.bindInputListeners();
        };


        /*
         * Puts function in window.mypa effectively exposing the function.
         */

        Application.prototype.expose = function(fn, name) {
            var base;
            if ((base = window.mypa).fn == null) {
                base.fn = {};
            }
            return window.mypa.fn[name] = fn;
        };


        /*
         * Adds the listeners for the inputfields.
         */

        Application.prototype.bindInputListeners = function() {
            externalJQuery('#mypa-signed').on('change', (function(_this) {
                return function(e) {
                    return $('#mypa-signed').prop('checked', externalJQuery('#mypa-signed').prop('checked'));
                };
            })(this));
            return externalJQuery('input[name=delivery_options]').on('change', (function(_this) {
                return function(e) {
                    var el, i, json, len, ref;
                    json = externalJQuery('input[name=delivery_options]').val();
                    if (json === '') {
                        $('input[name=mypa-delivery-time]:checked').prop('checked', false);
                        $('input[name=mypa-delivery-type]:checked').prop('checked', false);
                        return;
                    }
                    ref = $('input[name=mypa-delivery-time]');
                    for (i = 0, len = ref.length; i < len; i++) {
                        el = ref[i];
                        if ($(el).val() === json) {
                            $(el).prop('checked', true);
                            return;
                        }
                    }
                };
            })(this));
        };


        /*
         * Fetches delivery options and an overall page update.
         */
        Application.prototype.updatePage = function(postal_code, number, street) {
            var item, key, options, ref, settings, urlBase, current_date, saturday_delivery, cutoff_time;
            ref = window.mypa.settings.price;
            for (key in ref) {
                item = ref[key];
                if (!(typeof item === 'string' || typeof item === 'function')) {
                    throw new Error('Price needs to be of type string');
                }
            }
            settings = window.mypa.settings;
            urlBase = settings.base_url;
            current_date = new Date();
            if (number == null) {
                number = settings.number;
            }
            if (postal_code == null) {
                postal_code = settings.postal_code;
            }
            if (street == null) {
                street = settings.street;
            }
            if (!((street != null) || (postal_code != null) || (number != null))) {
                $('#mypa-no-options').html('Geen adres opgegeven');
                $('.mypa-overlay').removeClass('mypa-hidden');
                return;
            }
            /* Check if Saturday delivery is active */
            if (settings.saturday_delivery == true) {
                saturday_delivery = 1;
            } else {
                saturday_delivery = void 0;
            }

            cutoff_time = settings.cutoff_time != null ? settings.cutoff_time : void 0

            $('#mypa-no-options').html('Bezig met laden...');
            $('.mypa-overlay').removeClass('mypa-hidden');
            $('.mypa-location').html(street);

            options = {
                url: urlBase,
                data: {
                    cc: NATIONAL,
                    carrier: CARRIER,
                    number: number,
                    postal_code: postal_code,
                    delivery_time: settings.delivery_time != null ? settings.delivery_time : void 0,
                    delivery_date: settings.delivery_date != null ? settings.delivery_date : void 0,
                    cutoff_time: cutoff_time,
                    dropoff_days: settings.dropoff_days != null ? settings.dropoff_days : void 0,
                    saturday_delivery: saturday_delivery,
                    dropoff_delay: settings.dropoff_delay != null ? settings.dropoff_delay : void 0,
                    exclude_delivery_type: settings.exclude_delivery_type != null ? settings.exclude_delivery_type : void 0
                },
                success: renderPage,
                error: hideMyParcelOptions
            };
            return externalJQuery.ajax(options);
        };

        /*
         * optionsHaveBeenModified
         */
        Application.prototype.optionsHaveBeenModified = function() {
            externalJQuery("input[name='delivery_options']").change();

            return this;
        };

        Application.prototype.showDays = function() {
            $('#mypa-date-slider-left, #mypa-date-slider-right, #mypa-tabs-container').hide();
        };

        Application.prototype.hideDays = function() {
            $('#mypa-date-slider-left, #mypa-date-slider-right, #mypa-tabs-container').hide();
        };

        return Application;

    })();

    Slider = (function() {

        /*
         * Renders the available days for delivery
         */
        function Slider(deliveryDays) {
            moment = window.mypa.moment;
            moment.locale(NATIONAL);
            this.slideRight = bind(this.slideRight, this);
            this.slideLeft = bind(this.slideLeft, this);
            var $el, $tabs, date, delivery, deliveryTimes, html, i, index, len, ref;
            this.deliveryDays = deliveryDays;
            if (deliveryDays.length < 1) {
                $('mypa-delivery-row').addClass('mypa-hidden');
                return;
            }
            $('mypa-delivery-row').removeClass('mypa-hidden');
            deliveryDays.sort(this.orderDays);
            deliveryTimes = window.mypa.sortedDeliverytimes = {};
            $el = $('#mypa-tabs').html('');
            window.mypa.deliveryDays = deliveryDays.length;
            index = 0;
            ref = this.deliveryDays;
            for (i = 0, len = ref.length; i < len; i++) {
                delivery = ref[i];
                deliveryTimes[delivery.date] = delivery.time;
                date = moment(delivery.date);
                html = "<input type=\"radio\" id=\"mypa-date-" + index + "\" class=\"mypa-date\" name=\"date\" checked value=\"" + delivery.date + "\">\n<label for='mypa-date-" + index + "' class='mypa-tab active'>\n  <span class='mypa-day-of-the-week-item'>" + (date.format('dddd')) + "</span>\n <span class='date'>" + (date.format('DD MMMM')) + "</span>\n</label>";
                $el.append(html);
                index++;
            }
            $tabs = $('.mypa-tab');
            if ($tabs.length > 0) {
                $tabs.bind('click', updateDelivery);
                $tabs[0].click();
            }
            
            var tabsWidth = $("#mypa-tabs-container").width();
            if (tabsWidth > 0) {
                 $("#mypa-tabs-container").attr('style', "width:" + (tabsWidth) + "px");
            }
            $("#mypa-tabs").attr('style', "width:" + (this.deliveryDays.length * 105) + "px");
            this.makeSlider();
        }


        /*
         * Initializes the slider
         */

        Slider.prototype.makeSlider = function() {
            this.slider = {};
            this.slider.currentBar = 0;
            this.slider.tabWidth = $('.mypa-tab')[0].offsetWidth + 5;
            this.slider.tabsPerBar = Math.floor($('#mypa-tabs-container')[0].offsetWidth / this.slider.tabWidth);
            this.slider.bars = window.mypa.deliveryDays / this.slider.tabsPerBar;
            $('#mypa-date-slider-right').removeClass('mypa-slider-disabled');
            $('#mypa-date-slider-left').unbind().bind('click', this.slideLeft);
            return $('#mypa-date-slider-right').unbind().bind('click', this.slideRight);
        };


        /*
         * Event handler for sliding the date slider to the left
         */

        Slider.prototype.slideLeft = function(e) {
            var $el, left, slider;
            slider = this.slider;
            if (slider.currentBar === 1) {
                $(e.currentTarget).addClass('mypa-slider-disabled');
            } else if (slider.currentBar < 1) {
                return false;
            } else {
                $(e.currentTarget).removeClass('mypa-slider-disabled');
            }
            $('#mypa-date-slider-right').removeClass('mypa-slider-disabled');
            slider.currentBar--;

            $el = $('#mypa-tabs');
            left = this.slider.currentBar * this.slider.tabsPerBar * this.slider.tabWidth * -1 + 5 * this.slider.currentBar;
            return $el.attr('style', "left:" + left + "px; width:" + (window.mypa.deliveryDays * this.slider.tabWidth) + "px");
        };


        /*
         * Event handler for sliding the date slider to the right
         */

        Slider.prototype.slideRight = function(e) {
            var $el, left, slider;
            slider = this.slider;
            if (parseInt(slider.currentBar) === parseInt(slider.bars - 1)) {
                $(e.currentTarget).addClass('mypa-slider-disabled');
            } else if (slider.currentBar >= slider.bars - 1) {
                return false;
            } else {
                $(e.currentTarget).removeClass('mypa-slider-disabled');
            }
            $('#mypa-date-slider-left').removeClass('mypa-slider-disabled');
            slider.currentBar++;

            $el = $('#mypa-tabs');
            left = this.slider.currentBar * this.slider.tabsPerBar * this.slider.tabWidth * -1 + 5 * this.slider.currentBar;
            return $el.attr('style', "left:" + left + "px; width:" + (window.mypa.deliveryDays * this.slider.tabWidth) + "px");
        };


        /*
         * Order function for the delivery array
         */

        Slider.prototype.orderDays = function(dayA, dayB) {
            var dateA, dateB, max;
            dateA = moment(dayA.date);
            dateB = moment(dayB.date);
            max = moment.max(dateA, dateB);
            if (max === dateA) {
                return 1;
            }
            return -1;
        };

        return Slider;

    })();

    if (typeof mypajQuery !== "undefined" && mypajQuery !== null) {
        externalJQuery = mypajQuery;
    }

    if (externalJQuery == null) {
        externalJQuery = $;
    }

    if (externalJQuery == null) {
        externalJQuery = jQuery;
    }

    $ = externalJQuery;

    displayOtherTab = function() {
        return $('.mypa-tab-container').toggleClass('mypa-slider-pos-1').toggleClass('mypa-slider-pos-0');
    };


    /*
     * Starts the render of the delivery options with the preset config
     */

    renderPage = function(response) {
        if (response.data.message === 'No results') {
            /* Show input field for housenumber */
            $('#mypa-no-options').html('Het opgegeven huisnummer in combinatie met postcode ' + window.mypa.settings.postal_code + ' wordt niet herkend. Vul hier opnieuw uw huisnummer zonder toevoeging in.<br><br><input id="mypa-new-number" type="number" /><submit id="mypa-new-number-submit">Verstuur</submit>');
            $('.mypa-overlay').removeClass('mypa-hidden');
            externalJQuery('.myparcel_base_method').prop("checked", false).prop('disabled', true);

            $('#mypa-new-number-submit').click(function () {
                var houseNumber = $('#mypa-new-number').val();
                window.mypa.fn.updatePage(window.mypa.settings.postal_code, houseNumber);
                /** @todo uncheck options */
            });

            return;
        }
        $('.mypa-overlay').addClass('mypa-hidden');
        $('#mypa-delivery-option-check').bind('click', function() {
            return renderDeliveryOptions($('input[name=date]:checked').val());
        });
        new Slider(response.data.delivery);
        preparePickup(response.data.pickup);
        $('#mypa-delivery-options-title').on('click', function() {
            var date;
            date = $('input[name=date]:checked').val();
            renderDeliveryOptions(date);
            return updateInputField();
        });
        $('#mypa-pickup-options-title').on('click', function() {
            $('#mypa-pickup').prop('checked', true);
            return updateInputField();
        });
        return updateInputField();
    };

    preparePickup = function(pickupOptions) {
        var filter, i, j, len, len1, name1, pickupLocation, pickupPrice, ref, time;
        if (pickupOptions.length < 1) {
            $('#mypa-pickup-row').addClass('mypa-hidden');
            return;
        }
        $('#mypa-pickup-row').removeClass('mypa-hidden');
        pickupPrice = window.mypa.settings.price[PICKUP];
        $('.mypa-pickup-price').html(pickupPrice);
        $('.mypa-pickup-price').toggleClass('mypa-hidden', pickupPrice == null);
        window.mypa.pickupFiltered = filter = {};
        pickupOptions = sortLocationsOnDistance(pickupOptions);
        for (i = 0, len = pickupOptions.length; i < len; i++) {
            pickupLocation = pickupOptions[i];
            ref = pickupLocation.time;
            for (j = 0, len1 = ref.length; j < len1; j++) {
                time = ref[j];
                if (filter[name1 = PICKUP_TIMES[time.start]] == null) {
                    filter[name1] = [];
                }
                filter[PICKUP_TIMES[time.start]].push(pickupLocation);
            }
        }
        showDefaultPickupLocation('#mypa-pickup-address', filter[PICKUP_TIMES[NORMAL_PICKUP]][0]);
        $('#mypa-pickup-address').off().bind('click', renderPickup);
        return $('.mypa-pickup-selector').on('click', updateInputField);
    };


    /*
     * Sorts the pickup options on nearest location
     */

    sortLocationsOnDistance = function(pickupOptions) {
        return pickupOptions.sort(function(a, b) {
            return parseInt(a.distance) - parseInt(b.distance);
        });
    };


    /*
     * Displays the default location behind the pickup location
     */

    showDefaultPickupLocation = function(selector, item) {
        var html;
        html = ' - <span class="mypa-edit-location">Aanpassen</span><span class="mypa-text-location">' + item.location + ", " + item.street + " " + item.number + ", " + item.city + '</span>';
        $(selector).html(html);
        $(selector).parent().find('input').val(JSON.stringify(item));
        return updateInputField();
    };


    /*
     * Set the pickup time HTML and start rendering the locations page
     */

    renderPickup = function() {
        renderPickupLocation(window.mypa.pickupFiltered[PICKUP_TIMES[NORMAL_PICKUP]]);
        $('.mypa-location-time').html('- Vanaf 16.00 uur');
        $('#mypa-pickup').prop('checked', true);
        return false;
    };

    /*
     * Renders the locations in the array order given in data
     */

    renderPickupLocation = function(data) {
        var day_index, html, i, index, j, k, len, location, openingHoursHtml, orderedHours, ref, ref1, time;
        displayOtherTab();
        $('.mypa-onoffswitch-checkbox:checked').prop('checked', false);
        $('#mypa-location-container').html('');
        for (index = i = 0, ref = data.length - 1; 0 <= ref ? i <= ref : i >= ref; index = 0 <= ref ? ++i : --i) {
            location = data[index];
            orderedHours = orderOpeningHours(location.opening_hours);
            openingHoursHtml = '';
            for (day_index = j = 0; j <= 6; day_index = ++j) {
                openingHoursHtml += "<div>\n  <div class='mypa-day-of-the-week'>\n    " + DAYS_OF_THE_WEEK_TRANSLATED[day_index] + ":\n  </div>\n  <div class='mypa-opening-hours-list'>";
                ref1 = orderedHours[day_index];
                for (k = 0, len = ref1.length; k < len; k++) {
                    time = ref1[k];
                    openingHoursHtml += "<div>" + time + "</div>";
                }
                if (orderedHours[day_index].length < 1) {
                    openingHoursHtml += "<div><i>Gesloten</i></div>";
                }
                openingHoursHtml += '</div></div>';
            }
            html = "<div for='mypa-pickup-location-" + index + "' class=\"mypa-row-lg mypa-afhalen-row\">\n  <div class=\"mypa-afhalen-right\">\n    <i class='mypa-info'>\n    </i>\n  </div>\n  <div class='mypa-opening-hours'>\n    " + openingHoursHtml + "\n  </div>\n  <label for='mypa-pickup-location-" + index + "' class=\"afhalen-left\">\n    <div class=\"mypa-afhalen-check\">\n      <input id=\"mypa-pickup-location-" + index + "\" type=\"radio\" name=\"mypa-pickup-option\" value='" + (JSON.stringify(location)) + "'>\n      <label for='mypa-pickup-location-" + index + "' class='mypa-row-title'>\n        <div class=\"mypa-checkmark mypa-main\">\n          <div class=\"mypa-circle\"></div>\n          <div class=\"mypa-checkmark-stem\"></div>\n          <div class=\"mypa-checkmark-kick\"></div>\n        </div>\n      </label>\n    </div>\n    <div class='mypa-afhalen-tekst'>\n      <span class=\"mypa-highlight mypa-inline-block\">" + location.location + ", <b class='mypa-inline-block'>" + location.street + " " + location.number + ", " + location.city + "</b>,\n      <i class='mypa-inline-block'>" + (String(Math.round(location.distance / 100) / 10).replace('.', ',')) + " Km</i></span>\n    </div>\n  </label>\n</div>";
            $('#mypa-location-container').append(html);
        }
        return $('input[name=mypa-pickup-option]').bind('click', function(e) {
            var obj, selector;
            displayOtherTab();
            obj = JSON.parse($(e.currentTarget).val());
            selector = '#' + $('input[name=mypa-delivery-time]:checked').parent().find('span.mypa-address').attr('id');
            return showDefaultPickupLocation(selector, obj);
        });
    };

    orderOpeningHours = function(opening_hours) {
        var array, day, i, len;
        array = [];
        for (i = 0, len = DAYS_OF_THE_WEEK.length; i < len; i++) {
            day = DAYS_OF_THE_WEEK[i];
            array.push(opening_hours[day]);
        }
        return array;
    };

    updateDelivery = function(e) {
        var date;
        if ($('#mypa-delivery-option-check').prop('checked') !== true) {
            return;
        }
        date = $("#" + ($(e.currentTarget).prop('for')))[0].value;
        renderDeliveryOptions(date);
        return updateInputField();
    };

    renderDeliveryOptions = function(date) {
        var checked, deliveryTimes, html, hvoPrice, hvoText, i, index, json, len, price, ref, ref1, time;

        $('#mypa-delivery-options').html('');
        html = '';
        deliveryTimes = window.mypa.sortedDeliverytimes[date];
        index = 0;
        for (i = 0, len = deliveryTimes.length; i < len; i++) {
            time = deliveryTimes[i];
            price = window.mypa.settings.price[POST_NL_TRANSLATION[time.price_comment]];
            json = {
                date: date,
                time: [time]
            };
            checked = '';
            if (time.price_comment === 'standard') {
                checked = "checked";
            }
            html += "<label for=\"mypa-time-" + index + "\" class='mypa-row-subitem'>\n  <input id='mypa-time-" + index + "' type=\"radio\" name=\"mypa-delivery-time\" value='" + (JSON.stringify(json)) + "' " + checked + ">\n  <label for=\"mypa-time-" + index + "\" class=\"mypa-checkmark\">\n    <div class=\"mypa-circle mypa-circle-checked\"></div>\n    <div class=\"mypa-checkmark-stem\"></div>\n    <div class=\"mypa-checkmark-kick\"></div>\n  </label>\n  <span class=\"mypa-highlight\">" + (moment(time.start, 'HH:mm:SS').format('H.mm')) + " - " + (moment(time.end, 'HH:mm:SS').format('H.mm')) + " uur</span>";
            if (price != null) {
                html += "<span class='mypa-price'>" + price + "</span>";
            }
            html += "</label>";
            index++;
        }
        hvoPrice = window.mypa.settings.price.signed;
        hvoText = (ref = window.mypa.settings.text) != null ? ref.signed : void 0;
        if (hvoText == null) {
            hvoText = HVO_DEFAULT_TEXT;
        }
      
        if (hvoPrice !== DISABLED) {
            html += "<label for=\"mypa-signed\" class='mypa-row-subitem'>\n  <input type=\"checkbox\" name=\"mypa-signed\" class=\"mypa-onoffswitch-checkbox\" id=\"mypa-signed\">\n  <div class=\"mypa-switch-container\">\n    <div class=\"mypa-onoffswitch\">\n      <label class=\"mypa-onoffswitch-label\" for=\"mypa-signed\">\n        <span class=\"mypa-onoffswitch-inner\"></span>\n      <span class=\"mypa-onoffswitch-switch\"></span>\n      </label>\n    </div>\n  </div>\n  <span>";
            if (hvoPrice) {
                html += "<span class='mypa-price'>" + hvoPrice + "</span>";
            }
            html += "<span style=''>" + hvoText  + "</span>" + "</span></label>";
        }
      
        if ($('input[name=mypa-delivery-time]:checked').length < 1) {
            $($('input[name=mypa-delivery-time]')[0]).prop('checked', true);
        }
        return $('div#mypa-delivery-row label').bind('click', updateInputField);
    };

    /*
     * Sets the json to the selected input field to be with the form
     */
    updateInputField = function() {
        var stringData;
        var jsonData;

        stringData = $('input[name=mypa-delivery-time]:checked').val();
        if (typeof stringData !== 'undefined') {
            jsonData = JSON.parse(stringData);
            jsonData.options = {};
            jsonData.options.signature = $('#mypa-signed').prop('checked');

            stringData = JSON.stringify(jsonData);

            if (externalJQuery('input[name=delivery_options]').val() !== stringData) {
                externalJQuery('input[name=delivery_options]').val(stringData).change();
            }
        }
    };

    /*
     * Hide MyParcel options
     */
    hideMyParcelOptions = function() {
        if (typeof window.mypa.fn.hideOptions !== 'undefined') {
            window.mypa.fn.hideOptions();
        }
    };

}).call(this);
