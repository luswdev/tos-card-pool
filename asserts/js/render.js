$(document).ready(function(){
    cookies_init(); 

    $.getJSON('/data/config.json', function(json) {
        var card_id = 0;

        let title = new Vue({
            el: '#title-vue',
            data: {
                gen_num: json.gen,
                inverse: get_val('inverse_pick') != null ? parseInt(prget_val('inverse_pick'), 10) : parseInt(Cookies.get('inverse_pick'), 10)
            },
            methods: {
                inv() {
                    var inv = get_val('inverse_pick') != null ? get_val('inverse_pick') : Cookies.get('inverse_pick');
                    return inv == '1' ? 'inverse-on' : '';
                },
                click_inv: function() {
                    this.inverse = ~this.inverse;
                    var bufi = parseInt(Cookies.get('inverse_pick'), 10);
                        
                    Cookies.set('inverse_pick', bufi ? 0 : 1, { expires: 365, path: '/' });
            
                    $('.card-box').each( function() {
                        $(this).toggleClass('card-box-picked');
                    });
                }
            }
        });

        let pools = new Vue({
            el: '#pools-vue',
            data: {
                pools: json.pools,
                card_id: 0
            },
            methods: {
                increment() { 
                    return card_id++;
                },
                increment_id() { 
                    this.card_id += 1;
                },
                get_id() {
                    return card_id;
                },
                is_picked(id) {
                    var card_col = parseInt(id / 4),
                        picked = get_val('pick_share') ? get_val('pick_share') : Cookies.get('pick_history'),
                        inv = get_val('inverse_pick') != null ? get_val('inverse_pick') : Cookies.get('inverse_pick'),          
                        buf = (picked == '0') ? 0 : parseInt(picked[card_col], 16);

                    if (inv == '1') {
                        buf = ~buf;
                    }
                
                    return buf & (1 << (id % 4)) ? 'card-box-picked' : '';
                }
            },
            mounted: function () {                
                this.$nextTick( function () {
                    cookies_update();

                    $('.card-box').on('click', function() {
                        $(this).toggleClass('card-box-picked');

                        var card_id = $(this).attr('id').split('-')[1],
                            card_col = parseInt(card_id / 4),
                            picked = Cookies.get('pick_history'),
                            buf = parseInt(picked[card_col], 16);
                
                        if ($(this).hasClass('card-box-picked')){
                            buf |= (1 << (card_id % 4));
                        } else {
                            buf &= ~(1 << (card_id % 4));
                        }
                
                        picked = replace_string_at(picked, card_col, buf.toString(16));
                
                        Cookies.set('pick_history', picked, { expires: 365, path: '/' });
                    });
                });
            }
        });

        let modals = new Vue({
            el: '#modal-vue',
            data: {
                modals: json.modals
            },
            mounted: function () {
                this.$nextTick( function () {
                    materialize_init();

                    $('#reset-modal .modal-confirm').on('click', function() {
                        Cookies.set('pick_history', '0', { expires: 365, path: '/' });
                        Cookies.set('inverse_pick', 0, { expires: 365, path: '/' });
                            
                        window.location.href = "/";
                    });
                
                    $('#share-modal-trigger').on('click', function() {
                        $('#share-modal .modal-close').text('取消');
                        $('#share-modal input, #share-modal .modal-confirm').show();
                        $('#share-link-buf')[0].value = "https://tos.lusw.dev/?pick_share=" + Cookies.get('pick_history') + "&inverse_pick=" + Cookies.get('inverse_pick');
                        $('#share-modal h4').text('分享選取結果？');
                    });
                
                    $('#share-modal .modal-confirm').on('click', function() {
                        let copy_buf = document.querySelector('#share-link-buf');
                        copy_buf.select();
                    
                        if (document.execCommand('copy')) {
                            $('#share-modal h4').text('成功複製到剪貼簿！');
                        } else {
                            $('#share-modal h4').text('出了點狀況...');
                        }
                
                        $('#share-modal input, #share-modal .modal-confirm').hide();
                        $('#share-modal .modal-close').text('確定');
                    });


                    $(".material-tooltip").addClass("hide-on-med-and-down");
                });
            }
        });
    });
});

function cookies_init() {
    if (Cookies.get('pick_history') == undefined) {
        Cookies.set('pick_history', '0', { expires: 365, path: '/' }); 
    } else {
        Cookies.set('pick_history', Cookies.get('pick_history'), { expires: 365, path: '/' }); 
    }
    
    if (Cookies.get('inverse_pick') == undefined) {
        Cookies.set('inverse_pick', 0, { expires: 365, path: '/' });
    } else {
        Cookies.set('inverse_pick', Cookies.get('inverse_pick'), { expires: 365, path: '/' }); 
    }
}

function cookies_update() {
    var last_card_id = $('.card-box').last().attr('id').split('-')[1],
        total_col = parseInt(last_card_id / 4),
        current_cookies = Cookies.get('pick_history'),
        inverse = Cookies.get('inverse_pick');

    if (current_cookies.length < total_col) {
        Cookies.set('pick_history', current_cookies + '0'.repeat(total_col - current_cookies.length), { expires: 365, path: '/' });
    } else {
        Cookies.set('pick_history', current_cookies, { expires: 365, path: '/' });
    }

    Cookies.set('inverse_pick', inverse, { expires: 365, path: '/' });
}

function materialize_init() {
    $('.modal').modal({
        'endingTop': '35%'
    });

    $('.fixed-action-btn').floatingActionButton({
        direction: 'top',
        hoverEnabled: false
    });

    $('.tooltipped').tooltip({
        enterDelay: 1000
    });
}

function replace_string_at(str, ind, val)
{
    if (ind < 0 || ind > str.length) {
        return str;
    }

    return str.substr(0,ind) + val + str.substr(ind+1);
}

function get_val(par) {
    let urlParams = new URLSearchParams(window.location.search);
    var val = urlParams.get(par);

    return val;
}