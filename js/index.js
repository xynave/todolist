// Create needed constants
const list = document.querySelector('ul');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');
// Create an instance of a db object for us to store the open database in
let db;

window.onload = function () {
    // Open our database; it is created if it doesn't already exist
    // (see onupgradeneeded below)
    let request = window.indexedDB.open('notes_db', 1);

    // onerror handler signifies that the database didn't open successfully
    request.onerror = function () {
        console.log('Database failed to open');
    };

    // onsuccess handler signifies that the database opened successfully
    request.onsuccess = function () {
        console.log('Database opened succesfully');

        // Store the opened database object in the db variable. This is used a lot below
        db = request.result;

        // Run the displayData() function to display the notes already in the IDB
        displayData();
    };

    // Setup the database tables if this has not already been done
    request.onupgradeneeded = function (e) {

        // Grab a reference to the opened database
        let db = e.target.result;

        // Create an objectStore to store our notes in (basically like a single table)
        // including a auto-incrementing key
        let objectStore = db.createObjectStore('notes_os', {
            keyPath: 'id',
            autoIncrement: true
        });

        // Define what data items the objectStore will contain
        objectStore.createIndex('title', 'title', {
            unique: false
        });
        objectStore.createIndex('body', 'body', {
            unique: false
        });
        objectStore.createIndex('validate', 'validate', {
            unique: false
        });

        console.log('Database setup complete');
    };

    // Create an onsubmit handler so that when the form is submitted the addData() function is run
    form.onsubmit = addData;

    // Define the addData() function
    function addData(e) {
        // prevent default - we don't want the form to submit in the conventional way
        e.preventDefault();

        // grab the values entered into the form fields and store them in an object ready for being inserted into the DB
        let newItem = {
            title: titleInput.value,
            body: bodyInput.value,
            validate: "false"
        };

        // open a read/write db transaction, ready for adding the data
        let transaction = db.transaction(['notes_os'], 'readwrite');

        // call an object store that's already been added to the database
        let objectStore = transaction.objectStore('notes_os');

        // Make a request to add our newItem object to the object store
        var request = objectStore.add(newItem);
        request.onsuccess = function () {
            // Clear the form, ready for adding the next entry
            titleInput.value = '';
            bodyInput.value = '';
        };

        // Report on the success of the transaction completing, when everything is done
        transaction.oncomplete = function () {
            console.log('Transaction completed: database modification finished.');

            // update the display of data to show the newly added item, by running displayData() again.
            displayData();
        };

        transaction.onerror = function () {
            console.log('Transaction not opened due to error');
        };
    }

    // Define the displayData() function
    function displayData() {
        // Here we empty the contents of the list element each time the display is updated
        // If you ddn't do this, you'd get duplicates listed each time a new note is added
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }

        // Open our object store and then get a cursor - which iterates through all the
        // different data items in the store
        let objectStore = db.transaction('notes_os').objectStore('notes_os');
        objectStore.openCursor().onsuccess = function (e) {
            // Get a reference to the cursor
            let cursor = e.target.result;

            // If there is still another data item to iterate through, keep running this code
            if (cursor) {
                // Create a list item, h3, and p to put each data item inside when displaying it
                // structure the HTML fragment, and append it inside the list
                const listItem = document.createElement('li');
                const h3 = document.createElement('h3');
                const para = document.createElement('p');
                const deleteBtn = document.createElement('button');
                const ValidateBtn = document.createElement('button');

                listItem.appendChild(deleteBtn);
                listItem.appendChild(ValidateBtn);
                listItem.appendChild(h3);
                listItem.appendChild(para);
                list.appendChild(listItem);

                // Put the data from the cursor inside the h3 and para
                h3.textContent = cursor.value.title;
                para.textContent = cursor.value.body;

                // Store the ID of the data item inside an attribute on the listItem, so we know
                // which item it corresponds to. This will be useful later when we want to delete items
                listItem.setAttribute('data-note-id', cursor.value.id);

                // Create a button and place it inside each listItem

                deleteBtn.textContent = 'Delete';

                // Set an event handler so that when the button is clicked, the deleteItem()
                // function is run
                deleteBtn.className = "float-right button-recherche2";
                deleteBtn.innerHTML = '<img src="./asset/close.png" class="taille" alt="close">';
                deleteBtn.onclick = deleteItem;

                if (cursor.value.validate == "false") {
                    ValidateBtn.className = "float-right button-recherche2";
                    ValidateBtn.innerHTML = '<img src="./asset/case.png" class="taille2" alt="case">';
                } else {
                    ValidateBtn.className = "float-right button-recherche2";
                    ValidateBtn.innerHTML = '<img src="./asset/casecheck.png" class="taille2" alt="case">';
                }
                ValidateBtn.onclick = validate;

                // Iterate to the next item in the cursor
                cursor.continue();
            } else {
                // Again, if list item is empty, display a 'No notes stored' message
                if (!list.firstChild) {
                    const listItem = document.createElement('li');
                    listItem.textContent = 'No things to do.'
                    list.appendChild(listItem);
                }
                // if there are no more cursor items to iterate through, say so
                console.log('Notes all displayed');
            }
        };
    }

    function validate(a) {
        var sPath = a.target.src;
        var sFileName = sPath.substring(sPath.lastIndexOf("/") + 1, sPath.length)
        if (sFileName == 'case.png') {
            a.target.src = "./asset/casecheck.png";
            let noteId = Number(a.target.parentNode.parentNode.getAttribute('data-note-id'));

            // open a database transaction and delete the task, finding it using the id we retrieved above
            let transaction = db.transaction(['notes_os'], 'readwrite');
            let objectStore = transaction.objectStore('notes_os');
            var objectStoreTitleRequest = objectStore.get(noteId);

            objectStoreTitleRequest.onsuccess = function () {
                var data = objectStoreTitleRequest.result;
                data.validate = "true";

                var updateTitleRequest = objectStore.put(data);
                console.log(data);
                console.log("La transaction originelle est " + updateTitleRequest.transaction);
                updateTitleRequest.onsuccess = function () {
                    displayData();
                };
            };

        } else {
            a.target.src = "./asset/case.png";
            let noteId = Number(a.target.parentNode.parentNode.getAttribute('data-note-id'));

            // open a database transaction and delete the task, finding it using the id we retrieved above
            let objectStore = db.transaction(['notes_os'], 'readwrite').objectStore('notes_os');
            var objectStoreTitleRequest = objectStore.get(noteId);

            objectStoreTitleRequest.onsuccess = function () {
                var data = objectStoreTitleRequest.result;
                data.validate = "false";
                var updateTitleRequest = objectStore.put(data);
                console.log("La transaction originelle est " + updateTitleRequest.transaction);

                updateTitleRequest.onsuccess = function () {
                    displayData();
                };
            };
        }

    }
    // Define the deleteItem() function
    function deleteItem(e) {
        e.target.className = " animate"
        setTimeout(function () {
            // retrieve the name of the task we want to delete. We need
            // to convert it to a number before trying it use it with IDB; IDB key
            // values are type-sensitive.
            let noteId = Number(e.target.parentNode.parentNode.getAttribute('data-note-id'));

            // open a database transaction and delete the task, finding it using the id we retrieved above
            let transaction = db.transaction(['notes_os'], 'readwrite');
            let objectStore = transaction.objectStore('notes_os');
            let request = objectStore.delete(noteId);

            // report that the data item has been deleted
            transaction.oncomplete = function () {
                // delete the parent of the button
                // which is the list item, so it is no longer displayed
                e.target.parentNode.parentNode.parentNode.removeChild(e.target.parentNode.parentNode);
                console.log('Note ' + noteId + ' deleted.');


                // Again, if list item is empty, display a 'No notes stored' message
                if (!list.firstChild) {
                    const listItem = document.createElement('li');
                    listItem.textContent = 'No notes stored.';
                    list.appendChild(listItem);

                }

            };
        }, 3200);

    }


};