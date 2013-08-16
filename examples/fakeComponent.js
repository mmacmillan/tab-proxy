!function($, undefined) {

    var _obj = {
        MethodOne: function() {
            console.log('running MethodOne');

            $.ajax({
                url: '/GetDemoStuff/',
                dataType: 'json',
                type: 'GET'
            }).done(_obj.MethodOneHandler);
        },

        MethodOneHandler: function(status, res) {
            console.log('running MethodOneHandler; status: ', status);
            console.log('data: ', JSON.parse(res.responseText));
        }
    };

    window['FakeComponent'] = _obj;
}(jQuery)
