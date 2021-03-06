{
    let view = {
        el: '.songlist-container',
        $mask: $('.mask'),
        $list: $('#songlist'),
        template: `
            <ul class="songlist-ul">
            </ul>
        `,
        render(data) {
            $(this.el).html(this.template);

            let {songs, currentPlayId} = data;
            if(!currentPlayId){
                currentPlayId = songs[songs.length-1].id
            }
            let liList = songs.map((song) => {
                let nameSpan = $('<span></span>').addClass('song-title').text(song.name);
                let singerSpan = $('<span></span>').addClass('singer').text(song.singer);
                let $li = $('<li></li>').append(nameSpan).append(singerSpan).attr('data-song-id', song.id);

                if(song.id === currentPlayId){
                    this.activeItem($li);
                }

                return $li;
            });
            $(this.el).find('ul').empty();

            liList.map((domLi)=>{
                $(this.el).find('ul').prepend(domLi);
            });
        },
        activeItem(li){
            let $li = $(li);
            $li.addClass('active').siblings().removeClass('active');
        },
        clearActive(){
            $(this.el).find('.active').removeClass('active');
        },
        openlist(){
            this.$mask.addClass('active');
            this.$list.addClass('active');
        },
        closelist(){
            this.$list.removeClass('active');
            this.$mask.removeClass('active');
        },
        scrollToCurrent(){
            let targetTop = $(this.el).find('li.active')[0].offsetTop;
            $(this.el).scrollTop(targetTop - 120)
        }
    };
    let model = {
        data:{
            songs:[ ],
            currentPlayId: undefined,
            status: 'close',
        },
        find(){
            var query = new AV.Query('Song');
            return query.find().then( (songs) => {
                this.data.songs = songs.map((song)=>{
                    return {id: song.id, ...song.attributes}
                });

                return songs;
            })
        }
    };
    let controller = {
        init(view,model){
            this.view = view;
            this.model = model;
            this.getSongs();
            this.bindEvents();
            this.bindEventHub();

        },
        getSongs(){
            return this.model.find().then(()=>{
                this.view.render(this.model.data);
                this.defaultSelect();
            });
        },
        bindEventHub(){
            window.eventHub.on('openlist', ()=>{
                this.view.openlist();
                let tit = document.title,
                    path = location.href.replace(/#.*$/, '') + '#!openlist';
                history.pushState({title: tit, path: path}, tit, path);
                this.model.data.status = 'open';
            });
            window.eventHub.on('cutSong', (cut)=>{
                let songs = this.model.data.songs;
                let currentPlayId = this.model.data.currentPlayId;
                let data;
                if(cut === 'next'){
                    for(let i=0; i<songs.length;i++){
                        if(songs[i].id === currentPlayId){
                            let n = i-1;
                            if(n < 0){
                                n = songs.length - 1
                            }
                            data = songs[n];
                            this.model.data.currentPlayId = data.id;
                            break
                        }
                    }
                }else if(cut === 'prev'){
                    for(let i=0; i<songs.length;i++){
                        if(songs[i].id === currentPlayId){
                            let n = i+1;
                            if(n >= songs.length){
                                n = 0
                            }
                            data = songs[n];
                            this.model.data.currentPlayId = data.id;
                            break
                        }
                    }
                }
                data = JSON.parse(JSON.stringify(data));
                window.eventHub.emit('select', data);
                this.view.render(this.model.data);
                this.view.scrollToCurrent();
            });
        },
        defaultSelect(){
            let songs = this.model.data.songs;
            if(!this.model.data.currentPlayId){
                this.model.data.currentPlayId = songs[songs.length-1].id;
            }
            let data = songs[songs.length-1];
            data = JSON.parse(JSON.stringify(data));
            window.eventHub.emit('defaultSelect', data);
        },
        bindEvents(){
            $(this.view.el).on('click','li',(e)=>{
                let songId = e.currentTarget.getAttribute('data-song-id');
                this.model.data.currentPlayId = songId;
                this.view.render(this.model.data);
                let data;
                let songs = this.model.data.songs;
                for(let i = 0; i < songs.length; i++){
                    if(songs[i].id === songId){
                        data = songs[i];
                        break
                    }
                }
                data = JSON.parse(JSON.stringify(data));
                window.eventHub.emit('select', data);
            });
            this.view.$mask.on('click', () => this.view.closelist() );
            window.addEventListener('popstate', (e)=>{
                if(this.model.data.status === 'open'){
                    this.view.closelist();
                    this.model.data.status = 'close';
                }
            })
        },
    };

    controller.init(view,model);
}