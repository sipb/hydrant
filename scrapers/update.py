import fireroad
import catalog
import package


def run():
    print("=== Update fireroad data ===")
    fireroad.run()
    print("=== Update catalog data ===")
    catalog.run()
    print("=== Packaging ===")
    package.run()


if __name__ == "__main__":
    run()
