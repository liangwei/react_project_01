import {Top,Header} from './feature_1_app.js';
 require('../css/animate.css');


ReactDom.render(
	<Top menu={['精致一居','温馨二居','品质三居','三居以上']} title={$('#top').data('title')} pagetype = {$('#top').data('pagetype')} imgurl = {$('#top').data('imgurl')}/>,
	document.getElementById('top')
)


