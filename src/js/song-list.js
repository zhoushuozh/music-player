{
    let view = {
        el: '.songlist-container',
        template: `
            <ul>
                <li><span class="song-name">__name__</span><span class="singer">__singer__</span></li>
            </ul>
        `,
        render(data) {
            $(this.el).html(this.template);

            let {songs, selectSongId} = data;
            let liList = songs.map((song) => {
                let nameSpan = $('<span></span>').addClass('song-name').text(song.name);
                let singerSpan = $('<span></span>').addClass('singer').text(song.singer);
                return $('<li></li>').append(nameSpan).append(singerSpan);
            });
            $(this.el).find('ul').empty();

            liList.map((domLi)=>{
                $(this.el).find('ul').append(domLi);
            });
        },
        activeItem(li){
            let $li = $(li);
            $li.addClass('active').siblings().removeClass('active');
        },
        clearActive(){
            $(this.el).find('.active').removeClass('active');
        }
    };
    let model = {
        data:{
            songs:[ ],
            selectSongId: undefined,
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
            this.bindEventHub();
            this.bindEvents()
        },
        getSongs(){
            return this.model.find().then(()=>{
                this.view.render(this.model.data);
            });
        },
        bindEventHub(){
            window.eventHub.on('create', (songdata)=>{
                this.model.data.songs.unshift(songdata);
                this.view.render(this.model.data);
            });
            window.eventHub.on('clearListActive', ()=>{ this.view.clearActive() })
        },
        bindEvents(){
            $(this.view.el).on('click','li',(e)=>{
                this.view.activeItem(e.currentTarget);
                window.eventHub.emit('modifyTitle','歌曲信息');
                window.eventHub.emit('hideUpload', {});
            })
        }
    };

    controller.init(view,model);
}