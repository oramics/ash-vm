!function() {

var WORKSHOP = 'iclc_workshop_2016'

var WorkshopStorage = {
  values: null,
  initialized: false,

  init: function( peged, ed, pegText, edText ) {
    Storage.prototype.setObject = function( key, value ) { 
      this.setItem( key, JSON.stringify( value ) ); 
    }

    Storage.prototype.getObject = function( key ) { 
      var value = this.getItem( key ); 
      return value && JSON.parse( value ); 
    }
    
    this.values = localStorage.getObject( WORKSHOP )

    if( this.values === null ) {
      this.values = {
        lastSavedState: {
          grammar:null,
          test:null
        },
        userFiles: {}
      }

    }

    this.pegEditor  = peged
    this.testEditor = ed
    this.defaultPegText = pegText
    this.defaultEditorText = edText

    this.createGUI()
    this.initialized = true
  },

  createGUI: function() {
    var saveBtn = document.querySelector( '#saveBtn' ),
        loadMenu = document.querySelector( '#loadMenu' )

    saveBtn.onclick = function() {
      WorkshopStorage.getNameAndSave()
    }

    loadMenu.innerHTML = '<option>default</option>'

    var userFileNames = Object.keys( this.values.userFiles )
    for( var i = 0; i < userFileNames.length; i++ ){
      var opt = document.createElement('option')
      opt.innerText = userFileNames[ i ]
      loadMenu.appendChild( opt )
    }

    loadMenu.onchange = function( e ) {
      WorkshopStorage.loadFileWithName( e.target[ e.target.selectedIndex ].innerText ) 
    }

  },

  getNameAndSave: function() {
    var filename = window.prompt( 'Please enter a filename. Your file will be stored locally in your browser.' )

    WorkshopStorage.values.userFiles[ filename ] = {
      grammar: WorkshopStorage.pegEditor.getValue(),
      test: WorkshopStorage.testEditor.getValue()
    }

    WorkshopStorage.save() 
    WorkshopStorage.createGUI()
  },

  save : function() {
    localStorage.setObject( WORKSHOP, this.values )
  },

  getLocalStorage: function() {
    return this.values
  },

  getFileWithName: function( name ) {
    return this.values.userFiles[ name ]
  },

  loadFileWithName: function( name ) {
    if( name !== 'default' ) {
      var file = WorkshopStorage.getFileWithName( name )

      WorkshopStorage.pegEditor.setValue( file.grammar )
      WorkshopStorage.testEditor.setValue( file.test )
    }else{
      WorkshopStorage.pegEditor.setValue( WorkshopStorage.defaultPegText )
      WorkshopStorage.testEditor.setValue( WorkshopStorage.defaultEditorText )
    }
  },

  saveFileWithName: function( name, txt ) {
    this.values.userFiles[ name ] = txt
    this.save()
    
  },

  /* this file is saved after every user submitted code run. It represents the
   * current state of the editors, and is automatically restored upon
   * refresh.
   */

  saveState: function( grammar, test ) {
    if( this.initialized === true ) {
      this.values.lastSavedState.grammar = grammar
      this.values.lastSavedState.test = test
      this.save()
    }
  },
}

window.WorkshopStorage = WorkshopStorage

}()
