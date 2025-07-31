// Global variable to store the current row being edited
let currentRow = null;
let medicationCounter = 0; // To keep track of S.No

// Define medication type categories for logic
const INTERNAL_LIQUID_TYPES = ['Syrup', 'Injection', 'Insulin', 'Mixtures', 'Drops', 'Oral Gel', 'Oral Hygiene', 'Serum', 'Solution'];
const SOLID_TYPES = ['Tablet', 'Capsule', 'Powder', 'Lozenges'];
const FREE_FORM_TYPES = ['Lotion', 'Ointment', 'Cream', 'Inhaler', 'Soap', 'Shampoo', 'Gel'];

// Combine types that require the dosage modal
const REQUIRES_DOSAGE_MODAL = [...INTERNAL_LIQUID_TYPES, ...SOLID_TYPES];

document.addEventListener('DOMContentLoaded', function() {
    const medicationTableBody = document.querySelector('#medicationTable tbody');
    const addMedicationBtn = document.getElementById('addMedicationBtn');
    const dosageModal = new bootstrap.Modal(document.getElementById('dosageModal'));
    const saveDosageBtn = document.getElementById('saveDosageBtn');

    // Modal elements
    const morningDoseCheck = document.getElementById('morningDoseCheck');
    const morningQty = document.getElementById('morningQty');
    const morningUnit = document.getElementById('morningUnit');
    const morningFoodTiming = document.getElementById('morningFoodTiming');

    const lunchDoseCheck = document.getElementById('lunchDoseCheck');
    const lunchQty = document.getElementById('lunchQty');
    const lunchUnit = document.getElementById('lunchUnit');
    const lunchFoodTiming = document.getElementById('lunchFoodTiming');

    const nightDoseCheck = document.getElementById('nightDoseCheck');
    const nightQty = document.getElementById('nightQty');
    const nightUnit = document.getElementById('nightUnit');
    const nightFoodTiming = document.getElementById('nightFoodTiming');

    const symptomsTextarea = document.getElementById('symptoms');
    const medicalHistoryTextarea = document.getElementById('medicalHistory');
    const labTestsInput = document.getElementById('labTests'); // Get the lab tests input
    const findingsInput = document.getElementById('findings'); // Get the findings input

    // AI Suggestion elements
    const getSuggestionsBtn = document.getElementById('getSuggestionsBtn');
    const aiLoadingSpinner = document.getElementById('aiLoadingSpinner');
    const aiFindingsChipsContainer = document.getElementById('aiFindingsChips');
    const aiMedicationChipsContainer = document.getElementById('aiMedicationChips');
    const aiLabTestChipsContainer = document.getElementById('aiLabTestChips');
    const noFindingsMessage = document.getElementById('noFindingsMessage');
    const noMedicationsMessage = document.getElementById('noMedicationsMessage');
    const noLabTestsMessage = document.getElementById('noLabTestsMessage');


    // Preview and Download buttons
    const previewPrescriptionBtn = document.getElementById('previewPrescriptionBtn');
    const downloadPrescriptionBtn = document.getElementById('downloadPrescriptionBtn');
    const loadingPdf = document.getElementById('loadingPdf');
    const pdfContentDiv = document.getElementById('pdfContent');

    // Function to add a new medication row
    function addMedicationRow() {
        medicationCounter++;
        const newRow = medicationTableBody.insertRow();
        newRow.setAttribute('data-row-id', medicationCounter);

        let durationOptions = '';
        for (let i = 1; i <= 12; i++) {
            durationOptions += `<option value="${i}">${i}</option>`;
        }

        // Dynamically generate medication type options
        const allMedicationTypes = [...new Set([...SOLID_TYPES, ...INTERNAL_LIQUID_TYPES, ...FREE_FORM_TYPES])];
        let typeOptionsHtml = allMedicationTypes.map(type => `<option value="${type}" ${type === 'Tablet' ? 'selected' : ''}>${type}</option>`).join('');

        newRow.innerHTML = `
            <td>${medicationCounter}</td>
            <td><input type="text" class="form-control medication-name" id="medicationName_${medicationCounter}" placeholder="Medication Name" aria-label="Medication Name" autocomplete="off"></td>
            <td>
                <select class="form-select medication-type" id="medicationType_${medicationCounter}" aria-label="Medication Type" autocomplete="off">
                    ${typeOptionsHtml}
                </select>
            </td>
            <td>
                <input type="text" class="form-control medication-dosage" id="medicationDosage_${medicationCounter}" placeholder="Set Dosage" readonly aria-label="Medication Dosage" autocomplete="off">
                <button type="button" class="btn btn-secondary btn-sm mt-1 set-dosage-btn" data-bs-toggle="modal" data-bs-target="#dosageModal">Set Dosage</button>
            </td>
            <td>
                <div class="d-flex">
                    <select class="form-select form-select-sm me-1 medication-duration-value" id="medicationDurationValue_${medicationCounter}" style="width: 80px;" aria-label="Medication Duration Value" autocomplete="off">
                        ${durationOptions}
                    </select>
                    <select class="form-select form-select-sm medication-duration-unit" id="medicationDurationUnit_${medicationCounter}" style="width: 100px;" aria-label="Medication Duration Unit" autocomplete="off">
                        <option value="days">days</option>
                        <option value="weeks">weeks</option>
                        <option value="months">months</option>
                        <option value="years">years</option>
                    </select>
                </div>
            </td>
            <td><input type="text" class="form-control medication-instructions" id="medicationInstructions_${medicationCounter}" placeholder="Instructions" readonly aria-label="Medication Instructions" autocomplete="off"></td>
            <td><button type="button" class="btn btn-danger btn-sm delete-medication-btn">Del</button></td>
        `;

        // Add event listeners to the new row's elements
        newRow.querySelector('.medication-type').addEventListener('change', handleMedicationTypeChange);
        newRow.querySelector('.set-dosage-btn').addEventListener('click', function() {
            currentRow = newRow; // Set the current row when modal is opened
            openDosageModal(this);
        });
        newRow.querySelector('.delete-medication-btn').addEventListener('click', function() {
            deleteMedicationRow(this);
        });

        // Trigger initial type change to set dosage input state
        handleMedicationTypeChange.call(newRow.querySelector('.medication-type'));
    }

    // Function to handle medication type change
    function handleMedicationTypeChange() {
        const row = this.closest('tr');
        const dosageInput = row.querySelector('.medication-dosage');
        const instructionsInput = row.querySelector('.medication-instructions');
        const setDosageBtn = row.querySelector('.set-dosage-btn');
        const selectedType = this.value;

        if (REQUIRES_DOSAGE_MODAL.includes(selectedType)) {
            dosageInput.setAttribute('readonly', true);
            instructionsInput.setAttribute('readonly', true); // Instructions also readonly for modal types
            setDosageBtn.style.display = 'inline-block'; // Show the button
            dosageInput.placeholder = 'Set Dosage';
            instructionsInput.placeholder = 'Instructions from Dosage';
        } else if (FREE_FORM_TYPES.includes(selectedType)) {
            dosageInput.removeAttribute('readonly');
            instructionsInput.removeAttribute('readonly');
            setDosageBtn.style.display = 'none'; // Hide the button
            dosageInput.placeholder = 'e.g., Apply twice daily';
            instructionsInput.placeholder = 'e.g., External use only';
        } else {
            // Fallback for any unlisted types, treat as free-form
            dosageInput.removeAttribute('readonly');
            instructionsInput.removeAttribute('readonly');
            setDosageBtn.style.display = 'none';
            dosageInput.placeholder = 'Enter Dosage';
            instructionsInput.placeholder = 'Enter Instructions';
        }
    }

    // Function to open the dosage modal and prepare it
    function openDosageModal(button) {
        // Reset all modal fields
        morningDoseCheck.checked = false;
        lunchDoseCheck.checked = false;
        nightDoseCheck.checked = false;
        morningQty.value = 0;
        lunchQty.value = 0;
        nightQty.value = 0;
        morningUnit.value = '';
        lunchUnit.value = '';
        nightUnit.value = '';
        morningFoodTiming.value = '';
        lunchFoodTiming.value = '';
        nightFoodTiming.value = '';

        // Disable quantity, unit and food timing inputs initially
        morningQty.disabled = true;
        morningUnit.disabled = true;
        morningFoodTiming.disabled = true;
        lunchQty.disabled = true;
        lunchUnit.disabled = true;
        lunchFoodTiming.disabled = true;
        nightQty.disabled = true;
        nightUnit.disabled = true;
        nightFoodTiming.disabled = true;

        const row = button.closest('tr');
        const medicationType = row.querySelector('.medication-type').value;
        const storedDosageDetails = row.dataset.dosageDetails;

        // Determine if unit inputs should be shown
        const showUnitInputs = INTERNAL_LIQUID_TYPES.includes(medicationType);

        // Set initial display for unit inputs
        morningUnit.style.display = showUnitInputs ? 'block' : 'none';
        lunchUnit.style.display = showUnitInputs ? 'block' : 'none';
        nightUnit.style.display = showUnitInputs ? 'block' : 'none';

        if (storedDosageDetails) {
            try {
                const details = JSON.parse(storedDosageDetails);
                if (details.morning) {
                    morningDoseCheck.checked = details.morning.checked;
                    morningQty.value = details.morning.qty;
                    morningUnit.value = details.morning.unit || '';
                    morningFoodTiming.value = details.morning.foodTiming;
                    morningQty.disabled = !details.morning.checked;
                    morningUnit.disabled = !details.morning.checked || !showUnitInputs;
                    morningFoodTiming.disabled = !details.morning.checked;
                }
                if (details.lunch) {
                    lunchDoseCheck.checked = details.lunch.checked;
                    lunchQty.value = details.lunch.qty;
                    lunchUnit.value = details.lunch.unit || '';
                    lunchFoodTiming.value = details.lunch.foodTiming;
                    lunchQty.disabled = !details.lunch.checked;
                    lunchUnit.disabled = !details.lunch.checked || !showUnitInputs;
                    lunchFoodTiming.disabled = !details.lunch.checked;
                }
                if (details.night) {
                    nightDoseCheck.checked = details.night.checked;
                    nightQty.value = details.night.qty;
                    nightUnit.value = details.night.unit || '';
                    nightFoodTiming.value = details.night.foodTiming;
                    nightQty.disabled = !details.night.checked;
                    nightUnit.disabled = !nightDoseCheck.checked || !showUnitInputs;
                    nightFoodTiming.disabled = !details.night.checked;
                }
            } catch (e) {
                console.error("Error parsing dosage details:", e);
            }
        }

        // Add event listeners for checkboxes to toggle input states
        morningDoseCheck.onchange = () => {
            morningQty.disabled = !morningDoseCheck.checked;
            morningUnit.disabled = !morningDoseCheck.checked || !showUnitInputs;
            morningFoodTiming.disabled = !morningDoseCheck.checked;
            if (!morningDoseCheck.checked) {
                morningQty.value = 0;
                morningUnit.value = '';
                morningFoodTiming.value = '';
            }
        };
        lunchDoseCheck.onchange = () => {
            lunchQty.disabled = !lunchDoseCheck.checked;
            lunchUnit.disabled = !lunchDoseCheck.checked || !showUnitInputs;
            lunchFoodTiming.disabled = !lunchDoseCheck.checked;
            if (!lunchDoseCheck.checked) {
                lunchQty.value = 0;
                lunchUnit.value = '';
                lunchFoodTiming.value = '';
            }
        };
        nightDoseCheck.onchange = () => {
            nightQty.disabled = !nightDoseCheck.checked;
            nightUnit.disabled = !nightDoseCheck.checked || !showUnitInputs;
            nightFoodTiming.disabled = !nightDoseCheck.checked;
            if (!nightDoseCheck.checked) {
                nightQty.value = 0;
                nightUnit.value = '';
                nightFoodTiming.value = '';
            }
        };
    }

    // Function to save dosage from modal to the table row
    saveDosageBtn.addEventListener('click', function() {
        if (!currentRow) return;

        const medicationType = currentRow.querySelector('.medication-type').value;
        const isInternalLiquid = INTERNAL_LIQUID_TYPES.includes(medicationType);

        const dosageDetails = {
            morning: {
                checked: morningDoseCheck.checked,
                qty: morningDoseCheck.checked ? parseInt(morningQty.value) : 0,
                unit: isInternalLiquid && morningDoseCheck.checked ? morningUnit.value.trim() : '',
                foodTiming: morningDoseCheck.checked ? morningFoodTiming.value : ''
            },
            lunch: {
                checked: lunchDoseCheck.checked,
                qty: lunchDoseCheck.checked ? parseInt(lunchQty.value) : 0,
                unit: isInternalLiquid && lunchDoseCheck.checked ? lunchUnit.value.trim() : '',
                foodTiming: lunchDoseCheck.checked ? lunchFoodTiming.value : ''
            },
            night: {
                checked: nightDoseCheck.checked,
                qty: nightDoseCheck.checked ? parseInt(nightQty.value) : 0,
                unit: isInternalLiquid && nightDoseCheck.checked ? nightUnit.value.trim() : '',
                foodTiming: nightDoseCheck.checked ? nightFoodTiming.value : ''
            }
        };

        currentRow.dataset.dosageDetails = JSON.stringify(dosageDetails);

        // Generate dosage string for the main table (Xunit-Yunit-Zunit for liquids, X-Y-Z for solids)
        const getDosagePart = (timeDetails) => {
            if (!timeDetails.checked) return '0';
            let part = timeDetails.qty;
            if (isInternalLiquid && timeDetails.unit) {
                part += timeDetails.unit;
            }
            return part;
        };
        const dosageString = `${getDosagePart(dosageDetails.morning)}-${getDosagePart(dosageDetails.lunch)}-${getDosagePart(dosageDetails.night)}`;

        // Generate instruction string (only food timing for liquids/solids)
        const getInstructionPart = (timeDetails) => {
            if (!timeDetails.checked) return '0';
            return timeDetails.foodTiming || 'Any time'; // Default to 'Any time' if no specific timing
        };
        const instructionString = `${getInstructionPart(dosageDetails.morning)} - ${getInstructionPart(dosageDetails.lunch)} - ${getInstructionPart(dosageDetails.night)}`;

        currentRow.querySelector('.medication-dosage').value = dosageString;
        currentRow.querySelector('.medication-instructions').value = instructionString.trim();

        dosageModal.hide();
    });

    // Function to delete a medication row
    function deleteMedicationRow(button) {
        const row = button.closest('tr');
        row.remove();
        updateMedicationSerialNumbers();
    }

    // Function to update S.No after adding/deleting rows
    function updateMedicationSerialNumbers() {
        const rows = medicationTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
            row.setAttribute('data-row-id', index + 1);
        });
        medicationCounter = rows.length;
    }

    // Function to append text to a textarea or input field
    function appendToField(field, textToAppend) {
        if (field.value.trim() === '') {
            field.value = textToAppend;
        } else {
            const lastChar = field.value.trim().slice(-1);
            if (lastChar === ',' || lastChar === ' ' || lastChar === ';') { // Added semicolon
                field.value += textToAppend;
            } else {
                field.value += `, ${textToAppend}`;
            }
        }
    }

    // Add event listeners for symptom chips
    document.querySelectorAll('#symptomChips .chip').forEach(chip => {
        chip.addEventListener('click', function() {
            appendToField(symptomsTextarea, this.textContent);
        });
    });

    // Add event listeners for history chips
    document.querySelectorAll('#historyChips .chip').forEach(chip => {
        chip.addEventListener('click', function() {
            appendToField(medicalHistoryTextarea, this.textContent);
        });
    });

    // Add event listeners for lab test chips
    document.querySelectorAll('#labTestChips .chip').forEach(chip => {
        chip.addEventListener('click', function() {
            appendToField(labTestsInput, this.textContent);
        });
    });

    // Function to display AI suggestions as chips
    function displaySuggestions(findings, medications, labTests) {
        // Clear previous suggestions
        aiFindingsChipsContainer.innerHTML = '';
        aiMedicationChipsContainer.innerHTML = '';
        aiLabTestChipsContainer.innerHTML = '';

        // Hide "No suggestions" messages by default
        noFindingsMessage.style.display = 'none';
        noMedicationsMessage.style.display = 'none';
        noLabTestsMessage.style.display = 'none';

        // Display Findings
        if (findings.length > 0) {
            findings.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'chip';
                chip.textContent = item.name; // Display only the name
                chip.title = item.explanation; // Full explanation on hover
                chip.setAttribute('data-name', item.name); // Store name for click
                chip.addEventListener('click', () => appendToField(findingsInput, chip.getAttribute('data-name')));
                aiFindingsChipsContainer.appendChild(chip);
            });
        } else {
            noFindingsMessage.style.display = 'block';
        }

        // Display Medications
        if (medications.length > 0) {
            medications.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'chip';
                chip.textContent = item.name;
                chip.title = item.explanation;
                chip.setAttribute('data-name', item.name);
                chip.addEventListener('click', () => {
                    // For medication, we add a new row and set its name
                    addMedicationRow(); // Add a new empty row
                    const newMedicationRow = medicationTableBody.lastElementChild;
                    if (newMedicationRow) {
                        newMedicationRow.querySelector('.medication-name').value = chip.getAttribute('data-name');
                    }
                });
                aiMedicationChipsContainer.appendChild(chip);
            });
        } else {
            noMedicationsMessage.style.display = 'block';
        }

        // Display Lab Tests
        if (labTests.length > 0) {
            labTests.forEach(item => {
                const chip = document.createElement('span');
                chip.className = 'chip';
                chip.textContent = item.name;
                chip.title = item.explanation;
                chip.setAttribute('data-name', item.name);
                chip.addEventListener('click', () => appendToField(labTestsInput, chip.getAttribute('data-name')));
                aiLabTestChipsContainer.appendChild(chip);
            });
        } else {
            noLabTestsMessage.style.display = 'block';
        }
    }

    // Function to parse AI response
    function parseAIResponse(text) {
        const findings = [];
        const medications = [];
        const labTests = [];

        // Split the text into sections
        const sections = text.split(/(Findings:|Medications:|Lab Tests:)/).filter(s => s.trim() !== '');

        let currentSection = '';
        for (let i = 0; i < sections.length; i++) {
            const sectionHeader = sections[i].trim();
            if (sectionHeader === 'Findings:') {
                currentSection = 'findings';
            } else if (sectionHeader === 'Medications:') {
                currentSection = 'medications';
            } else if (sectionHeader === 'Lab Tests:') {
                currentSection = 'labTests';
            } else {
                // Process content within each section
                const content = sections[i].trim();
                const lines = content.split('\n').filter(line => line.trim() !== '');

                lines.forEach(line => {
                    const match = line.match(/^\s*-\s*\*\*(.*?)\*\*:\s*(.*)/);
                    if (match) {
                        const name = match[1].trim();
                        const explanation = match[2].trim();
                        if (currentSection === 'findings') {
                            findings.push({ name, explanation });
                        } else if (currentSection === 'medications') {
                            medications.push({ name, explanation });
                        } else if (currentSection === 'labTests') {
                            labTests.push({ name, explanation });
                        }
                    }
                });
            }
        }
        return { findings, medications, labTests };
    }


    // Event listener for Get Suggestions button
    getSuggestionsBtn.addEventListener('click', async () => {
        aiLoadingSpinner.style.display = 'block'; // Show AI loading spinner
        // Clear previous suggestions
        aiFindingsChipsContainer.innerHTML = '';
        aiMedicationChipsContainer.innerHTML = '';
        aiLabTestChipsContainer.innerHTML = '';
        noFindingsMessage.style.display = 'none';
        noMedicationsMessage.style.display = 'none';
        noLabTestsMessage.style.display = 'none';


        const patientName = document.getElementById('patientName').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const bp = document.getElementById('bloodPressure').value;
        const temp = document.getElementById('temperature').value;
        const symptoms = document.getElementById('symptoms').value;
        const pastMedicalHistory = document.getElementById('medicalHistory').value;

        const patientInfoPrompt = `
Patient Information:

Name: ${patientName}
Age: ${age}
Gender: ${gender}
Blood Pressure (optional): ${bp}
Temperature (optional): ${temp}
Symptoms: ${symptoms}
Past Medical History/Long-term Problems: ${pastMedicalHistory || 'None'}

Based on this information, provide detailed medical findings, suitable medications, and required lab tests.

**It is CRITICAL to adhere to the following specific output format and detail level for each section:**

Findings:
- **[Finding Name]**: [COMPREHENSIVE EXPLANATION: Describe the finding, its characteristics, and its relevance to the patient's symptoms and history in detail.]

Medications:
- **[Medication Name]**: [DETAILED EXPLANATION: Describe its primary use, mechanism of action, important considerations, and specific relevance to the patient's condition and symptoms.]

Lab Tests:
- **[Lab Test Name]**: [DETAILED EXPLANATION: Explain what the test measures, its biological relevance, diagnostic role, expected results, and its connection to the patient’s case.]

Ensure all explanations are clear and directly related to the patient's information.

Limit the total output to a **maximum of 500 tokens**.
`;

        try {
            // Make request to your backend server
            const response = await fetch('/get-suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientInfoPrompt }) // Send the prompt to your server
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorData.details || errorData.error}`);
            }

            const result = await response.json(); // This is the direct result from Gemini API, proxied by your server
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const aiResponseText = result.candidates[0].content.parts[0].text;
                console.log("AI Raw Response:", aiResponseText);
                const { findings, medications, labTests } = parseAIResponse(aiResponseText);
                displaySuggestions(findings, medications, labTests);
            } else {
                console.warn("AI response structure unexpected or content missing.");
                noFindingsMessage.style.display = 'block';
                noMedicationsMessage.style.display = 'block';
                noLabTestsMessage.style.display = 'block';
            }
        } catch (error) {
            console.error("Error fetching AI suggestions:", error);
            aiFindingsChipsContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
            noFindingsMessage.style.display = 'none';
            noMedicationsMessage.style.display = 'none';
            noLabTestsMessage.style.display = 'none';
        } finally {
            aiLoadingSpinner.style.display = 'none';
        }
    });


    // Function to generate prescription HTML for PDF conversion
    function generatePrescriptionHtmlForPdf() {
        const patientName = document.getElementById('patientName').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const weight = document.getElementById('weight').value;
        const bloodPressure = document.getElementById('bloodPressure').value;
        const temperature = document.getElementById('temperature').value;
        const symptoms = document.getElementById('symptoms').value;
        const medicalHistory = document.getElementById('medicalHistory').value;
        const findings = document.getElementById('findings').value;
        const labTests = document.getElementById('labTests').value;
        const dateOfVisit = document.getElementById('dateOfVisit').value;
        const doctorName = document.getElementById('doctorName').value;
        const specialty = document.getElementById('specialty').value;
        const email = document.getElementById('email').value;
        const phoneNumber = document.getElementById('phoneNumber').value;
        const nextFollowupDate = document.getElementById('nextFollowupDate').value;

        let medicationsHtml = '';
        const medicationRows = medicationTableBody.querySelectorAll('tr');
        medicationRows.forEach(row => {
            const sNo = row.querySelector('td:first-child').textContent;
            const name = row.querySelector('.medication-name').value || '&nbsp;';
            const type = row.querySelector('.medication-type').value || '&nbsp;';
            const storedDosageDetails = row.dataset.dosageDetails;
            let dosageDisplay = '&nbsp;';
            let instructionsDisplay = '&nbsp;';

            if (REQUIRES_DOSAGE_MODAL.includes(type) && storedDosageDetails) {
                try {
                    const details = JSON.parse(storedDosageDetails);
                    const isInternalLiquid = INTERNAL_LIQUID_TYPES.includes(type);

                    // Dosage for PDF: Xunit-Yunit-Zunit for liquids, X-Y-Z for solids
                    const getDosagePartForPdf = (timeDetails) => {
                        if (!timeDetails.checked) return '0';
                        let part = timeDetails.qty;
                        if (isInternalLiquid && timeDetails.unit) {
                            part += timeDetails.unit;
                        }
                        return part;
                    };
                    dosageDisplay = `${getDosagePartForPdf(details.morning)}-${getDosagePartForPdf(details.lunch)}-${getDosagePartForPdf(details.night)}`;

                    // Instructions for PDF: FoodTiming - FoodTiming - FoodTiming (NO quantity, NO unit)
                    const getInstructionPartForPdf = (timeDetails) => {
                        if (!timeDetails.checked) return '0';
                        return timeDetails.foodTiming || 'Any time';
                    };
                    instructionsDisplay = `${getInstructionPartForPdf(details.morning)} - ${getInstructionPartForPdf(details.lunch)} - ${getInstructionPartForPdf(details.night)}`;

                } catch (e) {
                    console.error("Error parsing dosage details for PDF:", e);
                }
            } else {
                // Fallback for free-form types or if no dosage details are set
                dosageDisplay = row.querySelector('.medication-dosage').value || '&nbsp;';
                instructionsDisplay = row.querySelector('.medication-instructions').value || '&nbsp;';
            }

            const durationValue = row.querySelector('.medication-duration-value').value || '&nbsp;';
            const durationUnit = row.querySelector('.medication-duration-unit').value || '&nbsp;';

            medicationsHtml += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">${sNo}</td>
                    <td style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">${name}</td>
                    <td style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">${type}</td>
                    <td style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">${dosageDisplay}</td>
                    <td style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">${durationValue} ${durationUnit}</td>
                    <td style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">${instructionsDisplay}</td>
                </tr>
            `;
        });

        // Get current date for the "Date:" field in the PDF
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;


        // This is the HTML structure that html2pdf will convert
        return `
            <div style="font-family: 'Inter', sans-serif; margin: 20px; color: #000000;">
                <div style="text-align: right; font-size: 0.85em; margin-bottom: 15px;">
                    Date: ${formattedDate}
                </div>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em;">Patient Information</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Patient Name:</span> <span style="color: #000000; font-size: 0.9em;">${patientName || 'N/A'}</span>
                        </td>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Age:</span> <span style="color: #000000; font-size: 0.9em;">${age || 'N/A'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Gender:</span> <span style="color: #000000; font-size: 0.9em;">${gender || 'N/A'}</span>
                        </td>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Weight:</span> <span style="color: #000000; font-size: 0.9em;">${weight ? weight + ' kg' : 'N/A'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Blood Pressure:</span> <span style="color: #000000; font-size: 0.9em;">${bloodPressure || 'N/A'}</span>
                        </td>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Temperature:</span> <span style="color: #000000; font-size: 0.9em;">${temperature ? temperature + ' °C' : 'N/A'}</span>
                        </td>
                    </tr>
                </table>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em;">Symptoms</h2>
                <div style="margin-bottom: 15px; line-height: 1.4; min-height: 15px; color: #000000; font-size: 0.9em;">${symptoms.replace(/\n/g, '<br>') || 'N/A'}</div>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em;">Past Medical History</h2>
                <div style="margin-bottom: 15px; line-height: 1.4; min-height: 15px; color: #000000; font-size: 0.9em;">${medicalHistory.replace(/\n/g, '<br>') || 'N/A'}</div>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; min-height: 15px; margin-bottom: 10px; font-size: 1.1em;">Findings</h2>
                <div style="margin-bottom: 15px; line-height: 1.4; min-height: 15px; color: #000000; font-size: 0.9em;">${findings || 'N/A'}</div>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em;">Medications</h2>
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #57bcb3; color: white; font-weight: bold; font-size: 0.9em;">S.No</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #57bcb3; color: white; font-weight: bold; font-size: 0.9em;">Name</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #57bcb3; color: white; font-weight: bold; font-size: 0.9em;">Type</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #57bcb3; color: white; font-weight: bold; font-size: 0.9em;">Dosage</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #57bcb3; color: white; font-weight: bold; font-size: 0.9em;">Duration</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #57bcb3; color: white; font-weight: bold; font-size: 0.9em;">Instructions</th>
                        </tr>
                    </thead>
                    <tbody style="min-height: 50px;">
                        ${medicationsHtml || '<tr><td colspan="6" style="border: 1px solid #ddd; padding: 5px; text-align: left; color: #000000; font-size: 0.85em;">No medications added.</td></tr>'}
                    </tbody>
                </table>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em;">Lab Tests</h2>
                <div style="margin-bottom: 15px; line-height: 1.4; min-height: 15px; color: #000000; font-size: 0.9em;">${labTests || 'N/A'}</div>

                <h2 style="color: #1ea69a; border-bottom: 2px solid #57bcb3; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px; font-size: 1.1em;">Doctor Information</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Date of Visit:</span> <span style="color: #000000; font-size: 0.9em;">${dateOfVisit || 'N/A'}</span>
                        </td>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Doctor Name:</span> <span style="color: #000000; font-size: 0.9em;">${doctorName || 'N/A'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Specialty:</span> <span style="color: #000000; font-size: 0.9em;">${specialty || 'N/A'}</span>
                        </td>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Email:</span> <span style="color: #000000; font-size: 0.9em;">${email || 'N/A'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Phone Number:</span> <span style="color: #000000; font-size: 0.9em;">${phoneNumber || 'N/A'}</span>
                        </td>
                        <td style="padding: 5px 0; width: 50%;">
                            <span style="font-weight: bold; color: #167e74; font-size: 0.9em;">Next Followup Date:</span> <span style="color: #000000; font-size: 0.9em;">${nextFollowupDate || 'N/A'}</span>
                        </td>
                    </tr>
                </table>

                <div style="margin-top: 30px; text-align: right; font-size: 0.8em; color: #000000;">
                    Generated by AI Prescription Suggestion Maker
                </div>
            </div>
        `;
    }

    // Function to generate and open PDF
    async function generateAndOpenPdf(action) {
        loadingPdf.style.display = 'block'; // Show loading spinner
        
        const prescriptionHtmlContent = generatePrescriptionHtmlForPdf();
        pdfContentDiv.innerHTML = prescriptionHtmlContent; // Populate the hidden div

        // Temporarily make the hidden div visible for html2canvas (for debugging)
        // pdfContentDiv.style.opacity = '0.5'; // Make it semi-transparent to see if content appears
        pdfContentDiv.style.display = 'block'; // Ensure it's block
        pdfContentDiv.style.position = 'absolute'; // Keep it off-screen
        pdfContentDiv.style.left = '-9999px';
        pdfContentDiv.style.top = '-9999px';

        const patientNameForFile = document.getElementById('patientName').value.replace(/[^a-zA-Z0-9_]/g, '') || 'Patient';
        const filename = `Prescription_${patientNameForFile}_${new Date().toISOString().slice(0,10)}.pdf`;

        console.log(`Attempting to ${action} PDF...`);
        console.log("HTML content for PDF (from hidden div):", pdfContentDiv.innerHTML);

        try {
            // Give the browser a moment to render the content in the hidden div
            await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay

            // Ensure html2canvas is available in the window scope
            if (typeof window.html2canvas === 'undefined') {
                throw new Error("html2canvas library is not loaded. Please check the script tag.");
            }

            const canvas = await window.html2canvas(pdfContentDiv, { // Explicitly use window.html2canvas
                scale: 4, // Increased scale for better quality
                logging: true, // Enable logging for html2canvas
                useCORS: true // Important for images, if any external
            });

            // Check if the canvas actually has content
            if (canvas.width === 0 || canvas.height === 0) {
                throw new Error("html2canvas generated an empty canvas. Check the HTML content or its visibility.");
            }

            const imgData = canvas.toDataURL('image/png');
            
            if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
                throw new Error("jsPDF library is not loaded. Please check the script tag.");
            }

            const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4'); // Use A4 format and millimeters
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = canvas.height * imgWidth / canvas.width; // Calculate height to maintain aspect ratio
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            if (action === 'preview') {
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');
                console.log("PDF opened in new tab for preview using Object URL.");
                setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000); // Clean up URL
            } else if (action === 'download') {
                pdf.save(filename);
                console.log("PDF download initiated successfully.");
            }
        } catch (error) {
            console.error(`Error during PDF generation (${action}):`, error);
            loadingPdf.innerHTML = `<p class="text-danger">Error ${action}ing PDF: ${error.message || error}.</p>`;
        } finally {
            loadingPdf.style.display = 'none'; // Hide loading spinner
            // Reset the hidden div's styles
            pdfContentDiv.style.display = 'none';
            pdfContentDiv.style.opacity = '1';
            pdfContentDiv.style.position = 'absolute'; // Back to original
            pdfContentDiv.style.left = '-9999px';
            pdfContentDiv.style.top = '-9999px';
        }
    }

    // Event listeners for Preview and Download buttons
    previewPrescriptionBtn.addEventListener('click', () => generateAndOpenPdf('preview'));
    downloadPrescriptionBtn.addEventListener('click', () => generateAndOpenPdf('download'));

    // Initial row on page load
    addMedicationRow();

    // Event listener for "Add Medication" button
    addMedicationBtn.addEventListener('click', addMedicationRow);
}); // End of DOMContentLoaded
