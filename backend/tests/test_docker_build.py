"""Regression tests for backend/Dockerfile dependency resolution."""
import pathlib
import unittest

DOCKERFILE = pathlib.Path(__file__).resolve().parents[1] / "Dockerfile"


class TestDockerBuild(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = DOCKERFILE.read_text()

    def test_wheel_resolves_dependencies_together(self):
        # pip wheel must resolve the full dependency graph so incompatible
        # direct wheels cannot be preselected.
        wheel_line = next(
            line for line in self.content.splitlines()
            if line.strip().startswith("RUN pip wheel")
        )
        self.assertNotIn("--no-deps", wheel_line)
        self.assertIn("-r requirements.txt", wheel_line)

    def test_final_install_uses_offline_wheelhouse(self):
        # The runtime stage must install only from the wheelhouse, without
        # reaching the index again.
        install_lines = [
            line for line in self.content.splitlines()
            if "pip install" in line and "wheels" in line
        ]
        self.assertTrue(install_lines, "no wheelhouse install found")
        final = install_lines[-1]
        self.assertIn("--no-index", final)
        self.assertIn("--find-links=/wheels", final)
        self.assertIn("-r requirements.txt", final)


if __name__ == "__main__":
    unittest.main()
