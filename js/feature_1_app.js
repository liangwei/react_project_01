/**
 * 专题001
 * author lw
 */
const featuerParame = {
	defaultParams:{
		blockparam:[//id 0：1室；1：2室；2：3室；3：3室以上
			{
				id:'0',
				shownum:4
			},
			{
				id:'1',
				shownum:4
			},
			{
				id:'2',
				shownum:4
			},
			{
				id:'3',
				shownum:4
			}
		],
		pagetype:'0',
		moretext:'查看更多',
		title:'精品二手房',
		imgurl:'http://res2.esf.leju.com/m_leju/images/feature-1/top-img.jpg',
		typeArr:['精致一居','温馨二居','品质三居','三居以上'],
		houseUrl:window.currenturl+'/house/n1-aj1-m2-ar1-a1-s7827829-e'
	}
}

var Header = React.createClass({
	getDefaultProps:function(){
		return {
			//pagetype:0,//0：主页；1：二级页
			title:'',//默认标题
			menu:[]//菜单项
		}
	},
	getInitialState:function(){
		return {
			menuIsOpen:false
		}
	},
	clickHandle:function(ent){
		this.setState({
			menuIsOpen:!this.state.menuIsOpen
		})
	},
	backHandle:function(ent){
		let $self = $(ent.target);
		this.props.updateParame(featuerParame.defaultParams);
		ent.preventDefault();
	},
	menuHandle:function(ent){
		let $self = $(ent.target);
		this.props.updateParame({
			blockparam:[
				{
					id:$self.data('id').toString(),
					shownum:20
				}
			],
			pagetype:'1',
			moretext:'查看更多认证真房源',
			title:featuerParame.defaultParams.typeArr[$self.data('id')]
		});
		ent.preventDefault();
	},
	render:function(){
		let $lcon = this.props.pagetype == 0?<a href={window.currenturl} className="logo pa"><img src="http://res2.esf.leju.com/m_leju/images/feature-1/logo.png" alt="" /></a>:<a onClick={this.backHandle} href="javascript:void(0);" className="back pa"></a>;
		return (
			<div className="top-hd pr">
				<h1 className={this.props.pagetype==0?'no-em':this.state.menuIsOpen?'active':null} onClick={this.props.pagetype!=0&&this.clickHandle}>
					{this.props.title}
				</h1>
				{$lcon}
				<a href={window.currenturl} className="home pa"></a>
				{
					this.props.pagetype=='1'?
					<section className={'drop-down-box animated fadeIn'+(this.state.menuIsOpen?' show':'')}>
						<figure className="arrow-box"><em></em></figure>
						<ul className="cnt">
							{this.props.typeArr.map((str,index) => <li key={index}><a className={this.props.title== str?'active':''} href="javascript:void" data-id={index} onClick={this.menuHandle}>{str}</a></li>)}
						</ul>
					</section>
					:null
				}
			</div>
		);
	}
});

var NavMain = React.createClass({
		defaultProps:{
			type:[]
		},
		getInitialState:function(){
			return {
				fixNav:false,
				hasBindScroll:false
			}
		},
		scrollEnt:function(){
			var $bd = $('body'),
			_this = this;
			$(window).on('scroll',function(){
				if($('#h_0').length&&$bd.scrollTop()<($('#h_0').offset().top-$('.nav-m').height())){
					_this.setState({fixNav:false})
				}else{
					_this.setState({fixNav:true})
				}
			});
			this.setState({hasBindScroll:true});
		},
		clickHandle:function(ent){
			let dom = ent.target,
			$dom = $(dom);
			setTimeout(()=>{$('body').scrollTop($('#h_'+$(dom).data('val')).offset().top-$dom.closest('nav').height());},0);
			
			$dom.addClass('active').closest('li').siblings().find('a').removeClass();
			ent.preventDefault();
		},
		componentDidMount:function(){
			!this.props.hasBindScroll&&this.scrollEnt()
		},
		componentDidUnmount:function(){
			$(window).off('scroll');
		},
    render: function(){
    		var $nodes = this.props.typeArr.map((str,index) => (<li key={index} className="i"><a className={index==0?'active':''} onClick = {this.clickHandle} data-val={index} href="javascript:void(0)">{str}</a></li>));
        return (
	        <section className="nav-w">
						<nav className= {'nav-m'+(this.state.fixNav?' fx':'')}>
							<ul className="f-b">{$nodes}</ul>
						</nav>
	        </section>
      	);
    }
});
 
var Top = React.createClass({
	render: function(){
		return (
			<div>
				<Header {...this.props} />
				<section className="t-img">
					<img className="animated fadeIn" src={this.props.imgurl} alt=""/>
				</section>
				{this.props.pagetype=='0'&&<NavMain {...this.props}/>}
			</div>
		)
	}
});

var HouseItem = React.createClass({
	render:function(){
		let data = this.props.data;
		return (
			<li className="item" onClick={function(){window.location.href=window.currenturl+'/detail/'+data.id}}>
        <section className="t-b">
            <a href={window.currenturl+'/detail/'+data.id}><img className="animated fadeIn" src={data.picurl} alt={data.housetitle} title={data.housetitle} /></a>
            <figure className="b-bar">{data.communityname}</figure>
        </section>
        <section className="m-if">
            <ul className="f-b">
                <li className="st frt">{data.roomtypemiddle}</li>
                <li className="st">{data.buildingarea}平</li>
                <li className="i"><strong className="price">{data.price}</strong>万</li>
            </ul>
        </section>
	      <scction className="b-if cf">
	          <span className="name">{data.link_name}</span>
	          {data.isrec=='1'&&<img src="http://res2.esf.leju.com/m_leju/images/feature-1/ico-rz.png" alt="精品认证房" />}
	      </scction>
      </li>	
		)
	}
});

var HouseBlock = React.createClass({
	getInitialState:function(){
		return {
			houseData:null,
			isFirst:true
		}
	},
	helperGetData:function(){
		var _this = this;
		// if(window.localStorage.getItem('h_data_'+_this.props.id)){
		// 	_this.setState({
		// 		houseData:JSON.parse(window.localStorage.getItem('h_data_'+_this.props.id))
		// 	});
		// }else{
			if(window.fetch){
				fetch(this.props.houseUrl+_this.props.id).then(function(res){
					if(res.ok){
						res.json().then(function(json){
							_this.setState({
								houseData:json.data.list
							});
							window.localStorage.setItem('h_data_'+_this.props.id,JSON.stringify(json.data.list));
						});
					}else{
						console.log('request error')
					}
				});
			}else{
				$.post(this.props.houseUrl+_this.props.id,function(res){
					let list = JSON.parse(res).data.list;
					_this.setState({
						houseData:list
					});
					window.localStorage.setItem('h_data_'+_this.props.id,JSON.stringify(list))
				})
			}
		//}
	},
	componentDidMount:function(){this.helperGetData()},
	clickHandle:function(e){
		let $self = $(e.target);
		if($self.text()=='查看更多认证真房源'){
			window.location.href = window.currenturl+'/house';
		}else{
			this.props.updateParame({
				blockparam:[
					{
						id:$self.data('id').toString(),
						shownum:50
					}
				],
				pagetype:'1',
				moretext:'查看更多认证真房源',
				title:featuerParame.defaultParams.typeArr[$self.data('id')]
			});
		}
	},
	render:function(){
		let _this = this;
		let list = this.state.houseData || [];
		if(list.length>_this.props.shownum){
			list = list.filter(function(val,index){
				return index < _this.props.shownum
			});
		}
		return (
			<section className="house-wrap" id={'h_'+this.props.id}>
        {this.props.pagetype=='0'&&<header className="t-hd"><h2>{featuerParame.defaultParams.typeArr[parseInt(this.props.id)]}</h2></header>}
        <ul className={'h-ls cl'+(this.props.pagetype=='1'?' h-ls-e':'')}>
					{
						this.state.houseData?
						list.map(val => <HouseItem data = {val} />)
						:<li className="loading">正在加载中...</li>
					}
        </ul>
        {this.state.houseData&&<a href="javascript:void(0)" data-id={this.props.id} className="btn-m" onClick={this.clickHandle}>{this.props.moretext}</a>}
    	</section>
		)
	}
});

var MainBody = React.createClass({
	getInitialState:function(){
		featuerParame.defaultParams.updateParame = this.changeParam;
		return featuerParame.defaultParams;
	},
	changeParam:function(parameObj){
		this.setState(parameObj);
	},
	componentDidUpdate:function(){
		$('body').scrollTop(0)
	},
	render:function(){
		return (
			<article>
				<Top {...this.state} />
				{this.state.blockparam.map((v,i) => {
					return <HouseBlock key={v.id} {...this.state} shownum = {v.shownum} id = {v.id}/>
				})}
			</article>
		)
	}
});

export {MainBody,featuerParame};