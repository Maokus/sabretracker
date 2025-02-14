import * as firebase from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { calculateIPPTScore } from "./logic.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyC-w7aX93pR4IF2RbG1A50t2SFAf2aQFAM",
    authDomain: "sabretracker-1dab0.firebaseapp.com",
    projectId: "sabretracker-1dab0",
    storageBucket: "sabretracker-1dab0.firebasestorage.app",
    messagingSenderId: "593703071176",
    appId: "1:593703071176:web:53ea6af5b1dc086b10e4fd"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();

// DOM elements
const loginContainer = document.getElementById('login-container');
const soldiersTableContainer = document.getElementById('soldiers-table-container');
const soldierDetailContainer = document.getElementById('soldier-detail-container');
const soldiersTableBody = document.getElementById('soldiers-table-body');
const soldierNameElement = document.getElementById('soldier-name');
const scoreBreakdownElement = document.getElementById('score-breakdown');
const backButton = document.getElementById('back-button');
const loginButton = document.getElementById('login-button');

// Login functionality
loginButton.addEventListener('click', () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            loginContainer.style.display = 'none';
            soldiersTableContainer.style.display = 'block';
            loadSoldiers();
        })
        .catch(error => alert(error.message));
});

function loadSoldiers() {
    const soldiersCol = collection(db, 'soldiers');
    getDocs(soldiersCol).then(snapshot => {
        soldiersTableBody.innerHTML = ''; // Clear existing rows
        snapshot.forEach(doc => {
            const soldier = doc.data();
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const scoreCell = document.createElement('td');
            const editCell = document.createElement('td');
            const editButton = document.createElement('button');

            nameCell.textContent = `${soldier.first_name} ${soldier.last_name}`;
            scoreCell.textContent = soldier.points;

            editButton.textContent = "Edit";
            editButton.addEventListener('click', () => {
                openEditForm(doc.id, soldier);
            });

            editCell.appendChild(editButton);
            row.appendChild(nameCell);
            row.appendChild(scoreCell);
            row.appendChild(editCell);

            row.addEventListener('click', () => {
                loadSoldierDetail(doc.id);
            });

            soldiersTableBody.appendChild(row);
        });
    }).catch(error => {
        console.error("Error loading soldiers:", error);
    });
}

// Load soldier detail
function loadSoldierDetail(id) {
    const soldiersCol = doc(db, 'soldiers', id)
    getDoc(soldiersCol).then(docSnapshot => {
        if (docSnapshot.exists()) {
            const soldierData = docSnapshot.data();
            console.log('Soldier Data:', soldierData);
            soldierNameElement.textContent = `${soldierData.first_name} ${soldierData.last_name}`;
            scoreBreakdownElement.innerHTML = ''; // Clear existing breakdown

            const situpItem = document.createElement("li");
            situpItem.textContent = `Situps: ${soldierData.raw_scores.situps}`;
            const pushupItem = document.createElement("li");
            pushupItem.textContent = `Pushups: ${soldierData.raw_scores.pushups}`;
            const runItem = document.createElement("li");
            runItem.textContent = `Pushups: ${Math.trunc(soldierData.raw_scores.run_seconds / 60)}min ${soldierData.raw_scores.run_seconds % 60}s`;
            const scoreItem = document.createElement("li");
            scoreItem.textContent = `Points: ${soldierData.points}`;

            scoreBreakdownElement.append(situpItem, pushupItem, runItem, scoreItem);
            soldiersTableContainer.style.display = 'none';
            soldierDetailContainer.style.display = 'block';

        }
    })
}

function openEditForm(id, soldier) {
    // Pre-fill the form with current data
    document.getElementById('edit-first-name').value = soldier.first_name;
    document.getElementById('edit-last-name').value = soldier.last_name;
    document.getElementById('edit-situps').value = soldier.raw_scores.situps;
    document.getElementById('edit-pushups').value = soldier.raw_scores.pushups;
    document.getElementById('edit-run-time').value = soldier.raw_scores.run_seconds;

    // Show the edit form
    document.getElementById('edit-soldier-modal').style.display = 'block';

    // Handle form submission
    const editForm = document.getElementById('edit-soldier-form');
    editForm.onsubmit = (e) => {
        e.preventDefault(); // Prevent default form submission

        let situps = parseInt(document.getElementById('edit-situps').value)
        let pushups = parseInt(document.getElementById('edit-pushups').value)
        let run_seconds = parseInt(document.getElementById('edit-run-time').value)

        // Get the updated values
        const updatedSoldier = {
            first_name: document.getElementById('edit-first-name').value,
            last_name: document.getElementById('edit-last-name').value,
            points: calculateIPPTScore(situps, pushups, run_seconds, 20),
            raw_scores: {
                situps: situps,
                pushups: pushups,
                run_seconds: run_seconds
            }
        };

        // Update the soldier in Firestore
        const soldierDocRef = doc(db, 'soldiers', id);
        setDoc(soldierDocRef, updatedSoldier, { merge: true }).then(() => {
            alert('Soldier scores updated successfully!');
            document.getElementById('edit-soldier-modal').style.display = 'none'; // Close the modal
            loadSoldiers(); // Reload soldiers to reflect changes
        }).catch((error) => {
            alert('Error updating soldier scores:', error);
        });
    };
}

document.getElementById('cancel-edit-button').addEventListener('click', () => {
    document.getElementById('edit-soldier-modal').style.display = 'none';
});

// Back to table
backButton.addEventListener('click', () => {
    soldierDetailContainer.style.display = 'none';
    soldiersTableContainer.style.display = 'block';
});