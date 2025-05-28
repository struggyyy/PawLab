import { test, expect } from "@playwright/test";

const projectBaseName = "Test Project";
const taskBaseName = "Test Task";

const userEmail = "strugalajacob@gmail.com";
const userPassword = "test123";

// Helper function to generate unique names
const generateUniqueName = (baseName: string) => `${baseName} ${Date.now()}`;

test.describe("ManagMe E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill(userEmail);
    await page.locator('input[type="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL("/");
    await page.waitForSelector("select#project-select", { timeout: 15000 });
  });

  test("1. should create a new project and then a new task", async ({
    page,
  }) => {
    const currentProjectName = generateUniqueName(projectBaseName);
    const currentTaskName = generateUniqueName(taskBaseName);

    await page.locator('button:has-text("Add New Project")').click();
    await page.locator("input#new-project-name").fill(currentProjectName);
    await page
      .locator("textarea#new-project-description")
      .fill("Desc for project: " + currentProjectName);
    await page
      .locator(
        'form.project-form button[type="submit"]:has-text("Save Project")'
      )
      .click();

    await expect(page.locator("select#project-select")).toBeEnabled({
      timeout: 15000,
    });
    await page.selectOption("select#project-select", {
      label: currentProjectName,
    });
    await expect(page.locator("h2.current-project-name")).toHaveText(
      currentProjectName
    );

    await page
      .locator('div.task-section button.add-task:has-text("Add Task")')
      .click();
    await page.locator("input#task-title").fill(currentTaskName);
    await page
      .locator("textarea#task-description")
      .fill("Desc for task: " + currentTaskName);
    await page.selectOption("select#task-priority", { label: "Medium" });
    await page.locator("input#task-estimated-time").fill("5");
    await page
      .locator('form.task-form button[type="submit"]:has-text("Save Task")')
      .click();
    await expect(
      page.locator(
        `.kanban-board div.task-card h4.task-title:has-text("${currentTaskName}")`
      )
    ).toBeVisible();
  });

  test("2. should change task status using the move right button", async ({
    page,
  }) => {
    const currentProjectName = generateUniqueName(projectBaseName);
    const currentTaskName = generateUniqueName(taskBaseName);

    // Setup: Create project and task for this test
    await page.locator('button:has-text("Add New Project")').click();
    await page.locator("input#new-project-name").fill(currentProjectName);
    await page
      .locator("textarea#new-project-description")
      .fill("Desc for project: " + currentProjectName);
    await page
      .locator(
        'form.project-form button[type="submit"]:has-text("Save Project")'
      )
      .click();
    await expect(page.locator("select#project-select")).toBeEnabled({
      timeout: 15000,
    });
    await page.selectOption("select#project-select", {
      label: currentProjectName,
    });
    await expect(page.locator("h2.current-project-name")).toHaveText(
      currentProjectName
    );
    await page
      .locator('div.task-section button.add-task:has-text("Add Task")')
      .click();
    await page.locator("input#task-title").fill(currentTaskName);
    await page
      .locator("textarea#task-description")
      .fill("Desc for task: " + currentTaskName);
    await page
      .locator('form.task-form button[type="submit"]:has-text("Save Task")')
      .click();
    await page.waitForSelector(
      `.kanban-board div.task-card h4.task-title:has-text("${currentTaskName}")`
    );

    // Perform the actual test: Change task status using the move right button
    const taskCardLocator = `div.task-card:has(h4.task-title:has-text("${currentTaskName}"))`;
    const taskCard = page.locator(taskCardLocator);
    const moveRightButton = taskCard.locator(
      'button[title="Move Right"][data-testid^="move-right-button-"]'
    );

    const todoColumn = page.locator(
      'div.kanban-column:has(h3.column-header:has-text("To Do"))'
    );

    await moveRightButton.click();

    // Wait for the card to visually leave the "To Do" column.
    await expect(todoColumn.locator(taskCardLocator)).not.toBeVisible({
      timeout: 10000,
    });

    // Re-locate the task card which has presumably moved, ensuring it's visible for interaction.
    const movedTaskCard = page.locator(`${taskCardLocator}:visible`);

    await movedTaskCard.locator('button.expand-button[title="Expand"]').click();

    const statusRow = movedTaskCard.locator(
      'div.task-detail-row:has(div.task-detail-label:text-is("Status:"))'
    );
    const statusValueLocator = statusRow.locator("div.task-detail-value");
    await expect(statusValueLocator).toHaveText("In Progress", {
      timeout: 10000,
    });

    await movedTaskCard
      .locator('button.expand-button[title="Collapse"]')
      .click();
  });

  test("3. should edit a project and then a task", async ({ page }) => {
    const originalProjectName = generateUniqueName(projectBaseName);
    const originalTaskName = generateUniqueName(taskBaseName);
    const currentEditedProjectName = generateUniqueName("Edited Project");
    const currentEditedTaskName = generateUniqueName("Edited Task");

    // Setup: Create project and task
    await page.locator('button:has-text("Add New Project")').click();
    await page.locator("input#new-project-name").fill(originalProjectName);
    await page
      .locator(
        'form.project-form button[type="submit"]:has-text("Save Project")'
      )
      .click();
    await expect(page.locator("select#project-select")).toBeEnabled({
      timeout: 15000,
    });
    await page.selectOption("select#project-select", {
      label: originalProjectName,
    });
    await expect(page.locator("h2.current-project-name")).toHaveText(
      originalProjectName
    );
    await page
      .locator('div.task-section button.add-task:has-text("Add Task")')
      .click();
    await page.locator("input#task-title").fill(originalTaskName);
    await page
      .locator('form.task-form button[type="submit"]:has-text("Save Task")')
      .click();
    await page.waitForSelector(
      `.kanban-board div.task-card h4.task-title:has-text("${originalTaskName}")`
    );

    // Edit the project
    await page
      .locator(
        'div.current-project-details-section button:has-text("Edit Project")'
      )
      .click();
    await expect(
      page.locator(
        'div.modal-overlay div.modal-content h3.modal-title:has-text("Edit Project:")'
      )
    ).toBeVisible();
    await page
      .locator("div.modal-content input#edit-project-name")
      .fill(currentEditedProjectName);
    await page
      .locator("div.modal-content textarea#edit-project-description")
      .fill("Updated desc for: " + currentEditedProjectName);
    await page
      .locator(
        'div.modal-content form button[type="submit"]:has-text("Save Changes")'
      )
      .click();
    await expect(page.locator("select#project-select")).toBeEnabled({
      timeout: 15000,
    });
    await page.selectOption("select#project-select", {
      label: currentEditedProjectName,
    });
    await expect(page.locator("h2.current-project-name")).toHaveText(
      currentEditedProjectName
    );

    // Edit the task (original task name under the now edited project name context)
    const taskCardToEdit = page.locator(
      `div.task-card:has(h4.task-title:has-text("${originalTaskName}"))`
    );
    await expect(taskCardToEdit).toBeVisible();
    await taskCardToEdit
      .locator('button.edit-button[title="Edit Task"]')
      .click();
    await expect(
      page.locator('div.task-section h3:has-text("Edit Task")')
    ).toBeVisible();
    await page.locator("input#task-title").fill(currentEditedTaskName);
    await page
      .locator("textarea#task-description")
      .fill("Updated desc for: " + currentEditedTaskName);
    await page
      .locator('form.task-form button[type="submit"]:has-text("Update Task")')
      .click();
    await expect(
      page.locator(
        `div.task-card h4.task-title:has-text("${currentEditedTaskName}")`
      )
    ).toBeVisible();
  });

  test("4. should delete the edited task and then the edited project", async ({
    page,
  }) => {
    const projectToEditThenDelete = generateUniqueName(projectBaseName);
    const taskToEditThenDelete = generateUniqueName(taskBaseName);
    const finalEditedProjectName = generateUniqueName(
      "Edited Project for Deletion"
    );
    const finalEditedTaskName = generateUniqueName("Edited Task for Deletion");

    // Setup: Create and edit project and task
    await page.locator('button:has-text("Add New Project")').click();
    await page.locator("input#new-project-name").fill(projectToEditThenDelete);
    await page
      .locator(
        'form.project-form button[type="submit"]:has-text("Save Project")'
      )
      .click();
    await expect(page.locator("select#project-select")).toBeEnabled({
      timeout: 15000,
    });
    await page.selectOption("select#project-select", {
      label: projectToEditThenDelete,
    });

    await page
      .locator('div.task-section button.add-task:has-text("Add Task")')
      .click();
    await page.locator("input#task-title").fill(taskToEditThenDelete);
    await page
      .locator('form.task-form button[type="submit"]:has-text("Save Task")')
      .click();
    await page.waitForSelector(
      `.kanban-board div.task-card h4.task-title:has-text("${taskToEditThenDelete}")`
    );

    await page
      .locator(
        'div.current-project-details-section button:has-text("Edit Project")'
      )
      .click();
    await page
      .locator("div.modal-content input#edit-project-name")
      .fill(finalEditedProjectName);
    await page
      .locator(
        'div.modal-content form button[type="submit"]:has-text("Save Changes")'
      )
      .click();
    await expect(page.locator("select#project-select")).toBeEnabled({
      timeout: 15000,
    });
    await page.selectOption("select#project-select", {
      label: finalEditedProjectName,
    });

    const taskCardOriginalName = page.locator(
      `div.task-card:has(h4.task-title:has-text("${taskToEditThenDelete}"))`
    );
    await taskCardOriginalName
      .locator('button.edit-button[title="Edit Task"]')
      .click();
    await page.locator("input#task-title").fill(finalEditedTaskName);
    await page
      .locator('form.task-form button[type="submit"]:has-text("Update Task")')
      .click();
    await page.waitForSelector(
      `div.task-card h4.task-title:has-text("${finalEditedTaskName}")`
    );

    // Delete the task
    const taskCardToDelete = page.locator(
      `div.task-card:has(h4.task-title:has-text("${finalEditedTaskName}"))`
    );
    await expect(taskCardToDelete).toBeVisible();
    await taskCardToDelete
      .locator('button.delete-button[title="Delete Task"]')
      .click();
    await expect(taskCardToDelete).not.toBeVisible();

    // Delete the project
    await page
      .locator(
        'div.current-project-details-section button:has-text("Edit Project")'
      )
      .click();
    await expect(
      page.locator(
        'div.modal-overlay div.modal-content h3.modal-title:has-text("Edit Project:")'
      )
    ).toBeVisible();
    await page
      .locator(
        'div.modal-content button.button-danger:has-text("Delete Project")'
      )
      .click();
    await expect(
      page.locator(
        'div.modal-overlay div.modal-content h3.modal-title:has-text("Delete Project?")'
      )
    ).toBeVisible();
    await page
      .locator(
        'div.modal-actions button.button-danger:has-text("Yes, Delete Project")'
      )
      .click();

    await expect(
      page.locator(
        `select#project-select option:has-text("${finalEditedProjectName}")`
      )
    ).not.toBeVisible();
    const projectSelect = page.locator("select#project-select");
    const projectOptionCount = await projectSelect.locator("option").count();
    if (projectOptionCount > 1) {
    } else {
      await expect(projectSelect.locator('option[value=""]')).toBeVisible();
    }
    await expect(
      page
        .locator(
          'div.empty-state h2:has-text("Select a project to view details and tasks."), div.empty-state h2:has-text("No projects available.")'
        )
        .first()
    ).toBeVisible();
  });
});
