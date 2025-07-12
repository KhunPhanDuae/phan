// Ensure Firebase is initialized in index.html before this script runs

// DOM elements
const authSection = document.getElementById('auth-section');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signupButton = document.getElementById('signupButton');
const loginButton = document.getElementById('loginButton');
const authError = document.getElementById('auth-error');

const appSection = document.getElementById('app-section');
const currentUserDisplay = document.getElementById('currentUserDisplay');
const logoutButton = document.getElementById('logoutButton');
const profileButton = document.getElementById('profileButton');

const userList = document.getElementById('userList'); // This will now mainly be for Public Chat & Friends heading
const publicChatOption = document.getElementById('publicChatOption');
const friendList = document.getElementById('friendList'); // New: For displaying friends
const findFriendInput = document.getElementById('findFriendInput'); // New
const findFriendButton = document.getElementById('findFriendButton'); // New
const findFriendResult = document.getElementById('findFriendResult'); // New
const addFriendButton = document.getElementById('addFriendButton');   // New

const chatPartnerDisplay = document.getElementById('chatPartnerDisplay');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const imageUploadInput = document.getElementById('imageUploadInput'); // New
const sendButton = document.getElementById('sendButton');

const profileModal = document.getElementById('profile-modal');
const displayNameInput = document.getElementById('displayNameInput');
const saveProfileButton = document.getElementById('saveProfileButton');
const closeProfileModal = document.getElementById('closeProfileModal');
const profileError = document.getElementById('profile-error');

const editMessageModal = document.getElementById('edit-message-modal');
const editMessageInput = document.getElementById('editMessageInput');
const saveEditedMessageButton = document.getElementById('saveEditedMessageButton');
const closeEditMessageModal = document.getElementById('closeEditMessageModal');
const editError = document.getElementById('edit-error');

// Global variables
let currentUserId = null;
let currentUserDisplayName = 'Anonymous';
let selectedChatPartnerId = null;
let selectedChatPartnerDisplayName = '';
let currentChatRef = null;
let currentChatType = 'public'; // Default to public chat on load
let editingMessageId = null;
let foundFriendUid = null; // Stores UID of found user for adding friend

// --- Authentication Handlers ---
signupButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: email.split('@')[0]
        });
        usersRef.child(userCredential.user.uid).set({
            email: email,
            displayName: email.split('@')[0],
            status: 'online'
        });
    } catch (error) {
        authError.textContent = error.message;
    }
});

loginButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    authError.textContent = '';
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        authError.textContent = error.message;
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        if (currentUserId) {
            usersRef.child(currentUserId).update({ status: 'offline' });
        }
        await auth.signOut();
    } catch (error) {
        console.error("Error logging out:", error);
    }
});

// Auth state observer
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        currentUserDisplayName = user.displayName || 'Guest';
        currentUserDisplay.textContent = `Logged in as: ${currentUserDisplayName}`;
        
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');

        usersRef.child(currentUserId).update({
            displayName: currentUserDisplayName,
            status: 'online'
        });

        loadFriends(); // Load friends list
        loadAllUsersForFriendSearch(); // Load all users for finding friends
        selectPublicChat(); // Auto-select public chat on login

    } else {
        currentUserId = null;
        currentUserDisplayName = 'Anonymous';
        selectedChatPartnerId = null;
        selectedChatPartnerDisplayName = '';
        currentChatRef = null;
        currentChatType = 'public'; // Reset default
        editingMessageId = null;
        foundFriendUid = null;

        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');

        // Clear UI elements
        friendList.innerHTML = ''; // Clear friend list
        userList.querySelector('#publicChatOption').classList.remove('selected'); // Deselect public chat
        chatPartnerDisplay.textContent = 'Select a chat';
        messagesDiv.innerHTML = '';
        messageInput.value = '';
        sendButton.disabled = true;
        findFriendInput.value = '';
        findFriendResult.textContent = '';
        addFriendButton.classList.add('hidden');
    }
});

// --- Profile Management ---
profileButton.addEventListener('click', () => {
    displayNameInput.value = currentUserDisplayName;
    profileError.textContent = '';
    profileModal.classList.remove('hidden');
});

closeProfileModal.addEventListener('click', () => {
    profileModal.classList.add('hidden');
});

saveProfileButton.addEventListener('click', async () => {
    const newDisplayName = displayNameInput.value.trim();
    profileError.textContent = '';

    if (newDisplayName && currentUserId) {
        try {
            await auth.currentUser.updateProfile({
                displayName: newDisplayName
            });
            await usersRef.child(currentUserId).update({
                displayName: newDisplayName
            });
            currentUserDisplayName = newDisplayName;
            currentUserDisplay.textContent = `Logged in as: ${currentUserDisplayName}`;
            profileModal.classList.add('hidden');
            loadFriends(); // Reload friends to update display names if needed
        } catch (error) {
            profileError.textContent = "Error updating profile: " + error.message;
        }
    } else {
        profileError.textContent = "Display name cannot be empty.";
    }
});


// --- Friends Management ---
let allUsersData = {}; // Cache all users for friend search

function loadAllUsersForFriendSearch() {
    usersRef.on('value', (snapshot) => {
        allUsersData = {};
        snapshot.forEach((childSnapshot) => {
            const user = childSnapshot.val();
            const uid = childSnapshot.key;
            allUsersData[uid] = user;
        });
    });
}

findFriendButton.addEventListener('click', async () => {
    const searchTerm = findFriendInput.value.trim().toLowerCase();
    findFriendResult.textContent = '';
    addFriendButton.classList.add('hidden');
    foundFriendUid = null;

    if (searchTerm === '') {
        findFriendResult.textContent = 'Please enter an email or display name to search.';
        return;
    }

    if (currentUserId) {
        // Search among all users (excluding self and existing friends)
        let foundUser = null;
        for (const uid in allUsersData) {
            const user = allUsersData[uid];
            // Skip self and already friends
            if (uid === currentUserId || (allUsersData[currentUserId].friends && allUsersData[currentUserId].friends[uid])) {
                continue;
            }
            if (user.email.toLowerCase() === searchTerm || (user.displayName && user.displayName.toLowerCase().includes(searchTerm))) {
                foundUser = { uid, ...user };
                break;
            }
        }

        if (foundUser) {
            foundFriendUid = foundUser.uid;
            findFriendResult.textContent = `Found: ${foundUser.displayName} (${foundUser.email})`;
            addFriendButton.classList.remove('hidden');
        } else {
            findFriendResult.textContent = 'No user found or user is already your friend.';
        }
    }
});

addFriendButton.addEventListener('click', async () => {
    if (foundFriendUid && currentUserId) {
        try {
            // Add to current user's friends list
            await usersRef.child(currentUserId).child('friends').child(foundFriendUid).set(true);
            // Add to target user's friends list (mutual friendship)
            await usersRef.child(foundFriendUid).child('friends').child(currentUserId).set(true);
            
            findFriendResult.textContent = `${allUsersData[foundFriendUid].displayName} has been added to your friends.`;
            addFriendButton.classList.add('hidden');
            foundFriendUid = null;
            findFriendInput.value = '';
            loadFriends(); // Reload friends list to show new friend
        } catch (error) {
            findFriendResult.textContent = "Error adding friend: " + error.message;
        }
    }
});

function loadFriends() {
    friendList.innerHTML = ''; // Clear current friends list

    if (!currentUserId) return;

    usersRef.child(currentUserId).child('friends').on('value', async (snapshot) => {
        friendList.innerHTML = ''; // Clear again to prevent duplicates on update
        if (snapshot.exists()) {
            const friendUids = snapshot.val();
            const promises = [];
            for (const friendUid in friendUids) {
                // Fetch friend's details from allUsersData cache or directly from DB
                if (allUsersData[friendUid]) {
                    const friend = allUsersData[friendUid];
                    const listItem = document.createElement('li');
                    listItem.classList.add('user-list-item');
                    listItem.dataset.uid = friendUid;
                    listItem.dataset.displayName = friend.displayName || 'Unknown User';
                    listItem.dataset.chatType = 'private';
                    listItem.textContent = `${friend.displayName || 'Unknown User'} (${friend.status || 'offline'})`;
                    listItem.addEventListener('click', () => {
                        selectChatPartner(friendUid, friend.displayName || 'Unknown User');
                    });
                    friendList.appendChild(listItem);
                } else {
                    // Fallback if not in cache (shouldn't happen often if loadAllUsers is first)
                    promises.push(usersRef.child(friendUid).once('value').then(friendSnap => {
                        if (friendSnap.exists()) {
                            const friend = friendSnap.val();
                            const listItem = document.createElement('li');
                            listItem.classList.add('user-list-item');
                            listItem.dataset.uid = friendUid;
                            listItem.dataset.displayName = friend.displayName || 'Unknown User';
                            listItem.dataset.chatType = 'private';
                            listItem.textContent = `${friend.displayName || 'Unknown User'} (${friend.status || 'offline'})`;
                            listItem.addEventListener('click', () => {
                                selectChatPartner(friendUid, friend.displayName || 'Unknown User');
                            });
                            friendList.appendChild(listItem);
                        }
                    }));
                }
            }
            await Promise.all(promises); // Wait for all friend data to be fetched
        }
    });
}


// --- Chat Switching and Message Sending ---
publicChatOption.addEventListener('click', () => {
    selectPublicChat();
});

function selectChat(chatType, id = null, displayName = '') {
    // Remove 'selected' class from all list items
    document.querySelectorAll('.user-list-item').forEach(item => {
        item.classList.remove('selected');
    });

    // Add 'selected' class to the newly selected item
    if (chatType === 'public') {
        publicChatOption.classList.add('selected');
    } else if (id) {
        const selectedPrivateChat = document.querySelector(`.user-list-item[data-uid="${id}"]`);
        if (selectedPrivateChat) {
            selectedPrivateChat.classList.add('selected');
        }
    }

    // Detach previous listeners if any
    if (currentChatRef) {
        currentChatRef.off('child_added');
        currentChatRef.off('child_changed');
        currentChatRef.off('child_removed');
    }

    messagesDiv.innerHTML = ''; // Clear previous chat messages
    messageInput.value = '';
    sendButton.disabled = false; // Enable send button when a chat is selected

    currentChatType = chatType;

    if (chatType === 'public') {
        selectedChatPartnerId = null;
        selectedChatPartnerDisplayName = '';
        chatPartnerDisplay.textContent = 'General Chat';
        currentChatRef = publicChatRef;
    } else { // Private chat
        // Only allow private chat if the selected user is a friend
        if (!allUsersData[currentUserId] || !allUsersData[currentUserId].friends || !allUsersData[currentUserId].friends[id]) {
            chatPartnerDisplay.textContent = 'Not friends. Add them to chat.';
            sendButton.disabled = true;
            imageUploadInput.disabled = true;
            messagesDiv.innerHTML = '<p style="text-align: center; color: #888;">You can only chat with your friends. Add them first!</p>';
            currentChatRef = null; // No chat ref if not friends
            return;
        }

        selectedChatPartnerId = id;
        selectedChatPartnerDisplayName = displayName;
        chatPartnerDisplay.textContent = `Chatting with: ${selectedChatPartnerDisplayName}`;
        imageUploadInput.disabled = false;

        const chatIds = [currentUserId, selectedChatPartnerId].sort();
        const chatId = chatIds[0] + '_' + chatIds[1];
        // For private chats, ensure participants are set up
        chatsRef.child(chatId).child('participants').set({
            user1: chatIds[0],
            user2: chatIds[1]
        });
        currentChatRef = chatsRef.child(chatId).child('messages');
    }

    // Listen for new messages in the currently selected chat
    currentChatRef.on('child_added', (snapshot) => {
        const message = { id: snapshot.key, ...snapshot.val() };
        displayMessage(message);
    });

    // Listen for message changes (edits)
    currentChatRef.on('child_changed', (snapshot) => {
        const updatedMessage = { id: snapshot.key, ...snapshot.val() };
        updateMessageInView(updatedMessage);
    });

    // Listen for message removals (deletes)
    currentChatRef.on('child_removed', (snapshot) => {
        removeMessageFromView(snapshot.key);
    });
}

function selectPublicChat() {
    selectChat('public');
}

function selectChatPartner(uid, displayName) {
    selectChat('private', uid, displayName);
}

sendButton.addEventListener('click', async () => {
    const messageText = messageInput.value.trim();
    const imageFile = imageUploadInput.files[0];

    if (!currentChatRef || !currentUserId) return;

    if (messageText === '' && !imageFile) {
        alert('Please enter a message or select an image to send.');
        return;
    }

    sendButton.disabled = true; // Disable to prevent double sending
    let imageUrl = null;
    let imageName = null;

    if (imageFile) {
        try {
            // Upload image to Firebase Storage
            const timestamp = new Date().getTime();
            imageName = `${currentUserId}_${timestamp}_${imageFile.name}`;
            const imageRef = storageRef.child(`chat_images/${imageName}`);
            const snapshot = await imageRef.put(imageFile);
            imageUrl = await snapshot.ref.getDownloadURL();
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image: " + error.message);
            sendButton.disabled = false;
            return;
        }
    }

    // Send message to Firebase Realtime Database
    try {
        await currentChatRef.push({
            senderId: currentUserId,
            senderName: currentUserDisplayName,
            text: messageText,
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            edited: false,
            imageUrl: imageUrl || null,
            imageName: imageName || null
        });
        messageInput.value = ''; // Clear the input field
        imageUploadInput.value = ''; // Clear selected image
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
    } finally {
        sendButton.disabled = false; // Re-enable send button
    }
});

function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.dataset.messageId = message.id; // Store message ID on the element

    if (message.senderId === currentUserId) {
        messageElement.classList.add('sent');
    }

    const senderSpan = document.createElement('span');
    senderSpan.classList.add('sender');
    senderSpan.textContent = message.senderName + ': ';

    const textSpan = document.createElement('span');
    textSpan.classList.add('message-text');
    textSpan.textContent = message.text;

    // Display image if available
    if (message.imageUrl) {
        const imageElement = document.createElement('img');
        imageElement.src = message.imageUrl;
        imageElement.alt = message.imageName || 'chat image';
        imageElement.classList.add('message-image');
        messageElement.appendChild(imageElement);
    }

    // If edited, add an " (edited)" indicator
    if (message.edited) {
        const editedIndicator = document.createElement('span');
        editedIndicator.textContent = ' (edited)';
        editedIndicator.style.fontSize = '0.7em';
        editedIndicator.style.color = '#888';
        textSpan.appendChild(editedIndicator);
    }

    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('timestamp');
    if (message.timestamp) {
        const date = new Date(message.timestamp);
        timestampSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const actionsDiv = document.createElement('div'); // New actions container
    actionsDiv.classList.add('actions');

    if (message.senderId === currentUserId) { // Only show actions for own messages
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => {
            // Cannot edit messages with images easily for now
            if (message.imageUrl) {
                alert('Cannot edit image messages directly.');
                return;
            }
            openEditMessageModal(message.id, message.text);
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteMessage(message.id, message.imageName); // Pass imageName for storage deletion
        });

        actionsDiv.appendChild(editButton);
        actionsDiv.appendChild(deleteButton);
    }

    messageElement.appendChild(senderSpan);
    if (message.text) { // Only add textSpan if there is text
        messageElement.appendChild(textSpan);
    }
    
    messageElement.appendChild(timestampSpan);
    messageElement.appendChild(actionsDiv); // Add actions to the message element

    messagesDiv.appendChild(messageElement);

    // Scroll to the bottom of the chat, but only after images load to get correct height
    if (message.imageUrl) {
        imageElement.onload = () => {
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        };
    } else {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// Update an existing message in the UI
function updateMessageInView(updatedMessage) {
    const messageElement = messagesDiv.querySelector(`[data-message-id="${updatedMessage.id}"]`);
    if (messageElement) {
        const textSpan = messageElement.querySelector('.message-text');
        if (textSpan) {
            textSpan.innerHTML = ''; // Clear existing content
            textSpan.textContent = updatedMessage.text;

            if (updatedMessage.edited) {
                const editedIndicator = document.createElement('span');
                editedIndicator.textContent = ' (edited)';
                editedIndicator.style.fontSize = '0.7em';
                editedIndicator.style.color = '#888';
                textSpan.appendChild(editedIndicator);
            }
        }
        // If an image was present but now removed (not handled by current edit),
        // or if text was added/removed, the structure might need more complex re-rendering.
        // For simplicity, we assume text messages are edited and image messages are not.
        // If imageUrl changes, you would need to replace the imageElement or handle its removal.
    }
}

// Remove a message from the UI
async function removeMessageFromView(messageId) {
    const messageElement = messagesDiv.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.remove();
    }
}

// --- Edit Message Modal Logic ---
function openEditMessageModal(messageId, currentText) {
    editingMessageId = messageId;
    editMessageInput.value = currentText;
    editError.textContent = '';
    editMessageModal.classList.remove('hidden');
}

closeEditMessageModal.addEventListener('click', () => {
    editMessageModal.classList.add('hidden');
    editingMessageId = null; // Reset editing ID
});

saveEditedMessageButton.addEventListener('click', async () => {
    const newText = editMessageInput.value.trim();
    editError.textContent = '';

    if (newText && editingMessageId && currentChatRef) {
        try {
            await currentChatRef.child(editingMessageId).update({
                text: newText,
                edited: true // Mark as edited
            });
            editMessageModal.classList.add('hidden');
            editingMessageId = null; // Reset editing ID
        } catch (error) {
            editError.textContent = "Error saving changes: " + error.message;
        }
    } else {
        editError.textContent = "Message cannot be empty.";
    }
});

// --- Delete Message Logic ---
async function deleteMessage(messageId, imageName) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            if (currentChatRef && messageId) {
                // Delete message from Realtime Database
                await currentChatRef.child(messageId).remove();
                
                // If there was an image, delete it from Firebase Storage
                if (imageName) {
                    const imageRef = storageRef.child(`chat_images/${imageName}`);
                    await imageRef.delete();
                    console.log("Image deleted from Storage:", imageName);
                }
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message: " + error.message);
        }
    }
}

// Initial state
appSection.classList.add('hidden');
